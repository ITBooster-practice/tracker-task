import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	NotFoundException,
} from '@nestjs/common'
import type { MoveTaskToColumn } from '@repo/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '../../../generated/prisma/client'
import { PrismaService } from '../../../prisma/prisma.service'
import { BoardTasksService } from '../../../src/tasks/board-tasks.service'

const source = {
	id: 'source',
	boardId: 'board',
	projectId: 'project',
	key: 'CUSTOM',
	isSystem: false,
}
const target = { ...source, id: 'target' }
const moving = {
	id: 'moving',
	boardColumnId: 'source',
	position: 7,
	version: 0,
	priority: 'HIGH' as const,
	assigneeId: 'assignee',
	createdById: 'creator',
}
const dto: MoveTaskToColumn = {
	fromColumnId: 'source',
	toColumnId: 'target',
	position: 0,
	expectedVersion: 0,
}

function createPrismaMock() {
	const tx = {
		board: {
			findUnique: vi
				.fn()
				.mockResolvedValue({ id: 'board', name: 'Development', columns: [] }),
		},
		boardColumn: { findMany: vi.fn().mockResolvedValue([source, target]) },
		teamMember: { findUnique: vi.fn().mockResolvedValue({ id: 'assignee-member' }) },
		task: {
			findUnique: vi.fn().mockResolvedValue({ id: 'moving' }),
			update: vi
				.fn()
				.mockImplementation(({ data }: { data: Record<string, unknown> }) => ({
					...moving,
					status: 'TODO',
					...data,
					version: moving.version + 1,
				})),
		},
		$queryRaw: vi
			.fn()
			.mockResolvedValueOnce([{ id: 'board' }])
			.mockResolvedValue([moving]),
		$executeRaw: vi.fn().mockResolvedValue(1),
	}
	return {
		tx,
		teamMember: { findUnique: vi.fn().mockResolvedValue({ role: 'MEMBER' }) },
		project: { findUnique: vi.fn().mockResolvedValue({ id: 'project', teamId: 'team' }) },
		boardColumn: { findMany: vi.fn().mockResolvedValue([source, target]) },
		$transaction: vi
			.fn()
			.mockImplementation((operation: (client: typeof tx) => Promise<unknown>) =>
				operation(tx),
			),
	}
}

const databaseError = (code: string, sqlCode?: string) =>
	new Prisma.PrismaClientKnownRequestError('Database failure', {
		code,
		clientVersion: '7.4.0',
		...(sqlCode ? { meta: { code: sqlCode } } : {}),
	})

describe('BoardTasksService', () => {
	let prisma: ReturnType<typeof createPrismaMock>
	let service: BoardTasksService
	beforeEach(() => {
		prisma = createPrismaMock()
		service = new BoardTasksService(prisma as unknown as PrismaService)
	})

	it('returns board metadata and columns in a consistent read transaction', async () => {
		prisma.tx.board.findUnique.mockResolvedValue({
			id: 'board',
			name: 'Development',
			columns: [{ id: 'column', tasks: [] }],
		})
		expect(await service.getBoard('team', 'project', 'board', 'user')).toEqual({
			board: { id: 'board', name: 'Development' },
			columns: [{ id: 'column', tasks: [] }],
		})
		expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
			isolationLevel: 'RepeatableRead',
		})
	})

	it('rejects missing or foreign boards', async () => {
		prisma.tx.board.findUnique.mockResolvedValue(null)
		await expect(service.getBoard('team', 'project', 'foreign', 'user')).rejects.toThrow(
			NotFoundException,
		)
	})

	it('rejects a non-member before reading board data or moving tasks', async () => {
		prisma.teamMember.findUnique.mockResolvedValue(null)
		await expect(service.getBoard('team', 'project', 'board', 'user')).rejects.toThrow(
			ForbiddenException,
		)
		await expect(
			service.moveTask('team', 'project', 'moving', 'user', dto),
		).rejects.toThrow(ForbiddenException)
		expect(prisma.$transaction).not.toHaveBeenCalled()
	})

	it.each([null, { id: 'project', teamId: 'foreign' }])(
		'rejects missing or foreign project %j',
		async (project) => {
			prisma.project.findUnique.mockResolvedValue(project)
			await expect(service.getBoard('team', 'project', 'board', 'user')).rejects.toThrow(
				NotFoundException,
			)
		},
	)

	it('rejects missing columns before starting a transaction', async () => {
		prisma.boardColumn.findMany.mockResolvedValue([source])
		await expect(
			service.moveTask('team', 'project', 'moving', 'user', dto),
		).rejects.toThrow(NotFoundException)
		expect(prisma.$transaction).not.toHaveBeenCalled()
	})

	it('rechecks columns and boards after acquiring locks', async () => {
		prisma.tx.$queryRaw.mockReset().mockResolvedValue([])
		await expect(
			service.moveTask('team', 'project', 'moving', 'user', dto),
		).rejects.toThrow(NotFoundException)
		prisma.tx.$queryRaw.mockResolvedValue([{ id: 'board' }])
		prisma.tx.boardColumn.findMany.mockResolvedValue([source])
		await expect(
			service.moveTask('team', 'project', 'moving', 'user', dto),
		).rejects.toThrow(NotFoundException)
		expect(prisma.tx.task.update).not.toHaveBeenCalled()
	})

	it('allows members to move tasks between boards of one project', async () => {
		const other = { ...target, boardId: 'other-board' }
		prisma.boardColumn.findMany.mockResolvedValue([source, other])
		prisma.tx.boardColumn.findMany.mockResolvedValue([source, other])
		prisma.tx.$queryRaw
			.mockReset()
			.mockResolvedValueOnce([{ id: 'board' }, { id: 'other-board' }])
			.mockResolvedValue([moving])
		expect(
			await service.moveTask('team', 'project', 'moving', 'user', dto),
		).toMatchObject({ boardColumnId: 'target', position: 0, status: 'TODO' })
	})

	it.each([
		['MEMBER', 'creator'],
		['ADMIN', 'user'],
		['OWNER', 'user'],
	])(
		'allows %s/%s to change priority and column in one versioned update',
		async (role, userId) => {
			prisma.teamMember.findUnique.mockResolvedValue({ role })
			expect(
				await service.moveTask('team', 'project', 'moving', userId, {
					...dto,
					priority: 'LOW',
				}),
			).toMatchObject({ boardColumnId: 'target', priority: 'LOW', version: 1 })
			expect(prisma.tx.task.update).toHaveBeenCalledExactlyOnceWith(
				expect.objectContaining({
					where: expect.objectContaining({ version: 0 }),
					data: expect.objectContaining({
						boardColumnId: 'target',
						priority: 'LOW',
						version: { increment: 1 },
					}),
				}),
			)
		},
	)

	it.each(['new-assignee', null])(
		'changes column and assignee %j together for a creator',
		async (assigneeId) => {
			expect(
				await service.moveTask('team', 'project', 'moving', 'creator', {
					...dto,
					assigneeId,
				}),
			).toMatchObject({ boardColumnId: 'target', assigneeId, version: 1 })
			expect(prisma.tx.task.update).toHaveBeenCalledTimes(1)
			if (assigneeId) {
				expect(prisma.tx.teamMember.findUnique).toHaveBeenCalledWith({
					where: { teamId_userId: { teamId: 'team', userId: assigneeId } },
					select: { id: true },
				})
			} else {
				expect(prisma.tx.teamMember.findUnique).not.toHaveBeenCalled()
			}
		},
	)

	it.each([{ priority: 'LOW' as const }, { assigneeId: 'other' }, { assigneeId: null }])(
		'rejects metadata changes %j by a member who did not create the task',
		async (changes) => {
			await expect(
				service.moveTask('team', 'project', 'moving', 'user', { ...dto, ...changes }),
			).rejects.toThrow(ForbiddenException)
			expect(prisma.tx.task.update).not.toHaveBeenCalled()
			expect(prisma.tx.$executeRaw).not.toHaveBeenCalled()
		},
	)

	it('allows ordinary members to move with unchanged priority and assignee', async () => {
		await service.moveTask('team', 'project', 'moving', 'user', {
			...dto,
			priority: moving.priority,
			assigneeId: moving.assigneeId,
		})
		const data = prisma.tx.task.update.mock.calls[0][0].data
		expect(data).not.toHaveProperty('priority')
		expect(data).not.toHaveProperty('assigneeId')
		expect(prisma.tx.teamMember.findUnique).not.toHaveBeenCalled()
	})

	it('rejects an assignee outside the team before writing any task or position', async () => {
		prisma.tx.teamMember.findUnique.mockResolvedValue(null)
		await expect(
			service.moveTask('team', 'project', 'moving', 'creator', {
				...dto,
				priority: 'LOW',
				assigneeId: 'outsider',
			}),
		).rejects.toThrow(BadRequestException)
		expect(prisma.tx.task.update).not.toHaveBeenCalled()
		expect(prisma.tx.$executeRaw).not.toHaveBeenCalled()
	})

	it('updates metadata when the column and position stay unchanged', async () => {
		prisma.boardColumn.findMany.mockResolvedValue([source])
		prisma.tx.boardColumn.findMany.mockResolvedValue([source])
		prisma.tx.$queryRaw
			.mockReset()
			.mockResolvedValueOnce([{ id: 'board' }])
			.mockResolvedValue([{ ...moving, position: 0 }])
		expect(
			await service.moveTask('team', 'project', 'moving', 'creator', {
				...dto,
				toColumnId: source.id,
				priority: 'CRITICAL',
				assigneeId: null,
			}),
		).toMatchObject({
			boardColumnId: 'source',
			position: 0,
			priority: 'CRITICAL',
			assigneeId: null,
			version: 1,
		})
		expect(prisma.tx.task.update).toHaveBeenCalledTimes(1)
		expect(prisma.tx.$executeRaw).not.toHaveBeenCalled()
	})

	it('synchronizes status only for a known system target', async () => {
		prisma.tx.boardColumn.findMany.mockResolvedValue([
			source,
			{ ...target, key: 'DONE', isSystem: true },
		])
		expect(
			await service.moveTask('team', 'project', 'moving', 'user', dto),
		).toMatchObject({ status: 'DONE' })
	})

	it('preserves status for a system target with an unknown legacy key', async () => {
		prisma.tx.boardColumn.findMany.mockResolvedValue([
			source,
			{ ...target, key: 'CUSTOM', isSystem: true },
		])
		expect(
			await service.moveTask('team', 'project', 'moving', 'user', dto),
		).toMatchObject({ status: 'TODO' })
	})

	it('normalizes source and target positions while preserving stable task ordering', async () => {
		prisma.tx.$queryRaw
			.mockReset()
			.mockResolvedValueOnce([{ id: 'board' }])
			.mockResolvedValue([
				moving,
				{ id: 'source-task', boardColumnId: 'source', position: 3 },
				{ id: 'z', boardColumnId: 'target', position: 2 },
				{ id: 'a', boardColumnId: 'target', position: 2 },
			])
		expect(
			await service.moveTask('team', 'project', 'moving', 'user', {
				...dto,
				position: 1,
			}),
		).toMatchObject({ boardColumnId: 'target', position: 1 })
		expect(prisma.tx.$executeRaw).toHaveBeenCalledTimes(2)
	})

	it('reorders within a column and skips unchanged neighbour positions', async () => {
		prisma.boardColumn.findMany.mockResolvedValue([source])
		prisma.tx.boardColumn.findMany.mockResolvedValue([source])
		prisma.tx.$queryRaw
			.mockReset()
			.mockResolvedValueOnce([{ id: 'board' }])
			.mockResolvedValue([moving, { id: 'a', boardColumnId: 'source', position: 0 }])
		expect(
			await service.moveTask('team', 'project', 'moving', 'user', {
				...dto,
				toColumnId: 'source',
				position: 1,
			}),
		).toMatchObject({ position: 1 })
		expect(prisma.tx.$executeRaw).not.toHaveBeenCalled()
	})

	it('rejects an index beyond the target list before writing', async () => {
		await expect(
			service.moveTask('team', 'project', 'moving', 'user', { ...dto, position: 1 }),
		).rejects.toThrow(BadRequestException)
		expect(prisma.tx.task.update).not.toHaveBeenCalled()
	})

	it.each([null, { id: 'moving' }])(
		'distinguishes a deleted task from a changed source: %j',
		async (task) => {
			prisma.tx.$queryRaw
				.mockReset()
				.mockResolvedValueOnce([{ id: 'board' }])
				.mockResolvedValue([])
			prisma.tx.task.findUnique.mockResolvedValue(task)
			await expect(
				service.moveTask('team', 'project', 'moving', 'user', dto),
			).rejects.toThrow(task ? ConflictException : NotFoundException)
			expect(prisma.tx.task.update).not.toHaveBeenCalled()
		},
	)

	it('rejects a task that is already in the target instead of the declared source', async () => {
		prisma.tx.$queryRaw
			.mockReset()
			.mockResolvedValueOnce([{ id: 'board' }])
			.mockResolvedValue([{ ...moving, boardColumnId: 'target' }])
		await expect(
			service.moveTask('team', 'project', 'moving', 'user', dto),
		).rejects.toThrow(ConflictException)
	})

	it.each([
		['P2025', undefined, ConflictException],
		['P2003', undefined, ConflictException],
		['P2034', undefined, ConflictException],
		['P2010', '23503', ConflictException],
		['P2010', '40P01', ConflictException],
		['P2010', '40001', ConflictException],
	] as const)(
		'maps a rolled-back database error %s/%s',
		async (
			code: string,
			sqlCode: string | undefined,
			exception: typeof ConflictException | typeof NotFoundException,
		) => {
			prisma.$transaction.mockRejectedValue(databaseError(code, sqlCode))
			await expect(
				service.moveTask('team', 'project', 'moving', 'user', dto),
			).rejects.toThrow(exception)
		},
	)

	it.each(['40001', '40P01', '23503'])(
		'recognizes PostgreSQL adapter SQLSTATE %s in raw-query failures',
		async (originalCode) => {
			prisma.$transaction.mockRejectedValue(
				new Prisma.PrismaClientKnownRequestError('Adapter conflict', {
					code: 'P2010',
					clientVersion: '7.4.0',
					meta: { driverAdapterError: { cause: { originalCode } } },
				}),
			)
			await expect(
				service.moveTask('team', 'project', 'moving', 'user', dto),
			).rejects.toThrow(ConflictException)
		},
	)

	it.each([new Error('Unavailable'), databaseError('P2010', '42601')])(
		'preserves unexpected failures',
		async (error) => {
			prisma.$transaction.mockRejectedValue(error)
			await expect(
				service.moveTask('team', 'project', 'moving', 'user', dto),
			).rejects.toBe(error)
		},
	)

	it('rejects a stale version without modifying tasks or positions', async () => {
		await expect(
			service.moveTask('team', 'project', 'moving', 'user', {
				...dto,
				expectedVersion: 8,
				priority: 'LOW',
				assigneeId: null,
			}),
		).rejects.toMatchObject({
			response: {
				statusCode: 409,
				code: 'TASK_MOVE_CONFLICT',
				taskId: 'moving',
				reason: 'VERSION_MISMATCH',
			},
		})
		expect(prisma.tx.task.update).not.toHaveBeenCalled()
		expect(prisma.tx.$executeRaw).not.toHaveBeenCalled()
	})

	it('compares and increments the version in the same task update', async () => {
		expect(
			await service.moveTask('team', 'project', 'moving', 'user', dto),
		).toMatchObject({ version: 1 })
		expect(prisma.tx.task.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					id: 'moving',
					projectId: 'project',
					boardColumnId: 'source',
					version: 0,
				},
				data: expect.objectContaining({ version: { increment: 1 } }),
			}),
		)
	})
})
