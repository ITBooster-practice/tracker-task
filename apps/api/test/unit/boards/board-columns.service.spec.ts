import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	NotFoundException,
} from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma, type BoardColumn } from '../../../generated/prisma/client'
import { PrismaService } from '../../../prisma/prisma.service'
import { BoardColumnsService } from '../../../src/boards/board-columns.service'

function column(id: string, position: number, isSystem = false): BoardColumn {
	return {
		id,
		position,
		boardId: 'board',
		projectId: 'project',
		key: id,
		title: id,
		isSystem,
		createdAt: new Date(0),
		updatedAt: new Date(0),
	}
}

function createPrismaMock() {
	const tx = {
		$queryRaw: vi.fn().mockResolvedValue([{ id: 'board' }]),
		$executeRaw: vi.fn().mockResolvedValue(1),
		boardColumn: {
			findMany: vi.fn().mockResolvedValue([column('first', 0), column('second', 1)]),
			create: vi.fn().mockImplementation(({ data }: { data: Partial<BoardColumn> }) => ({
				...column('new', -1),
				...data,
			})),
			update: vi
				.fn()
				.mockImplementation(
					({ where, data }: { where: { id: string }; data: Partial<BoardColumn> }) => ({
						...column(where.id, 0),
						...data,
					}),
				),
			findUniqueOrThrow: vi.fn().mockResolvedValue(column('new', 2)),
			delete: vi.fn().mockResolvedValue(column('first', 0)),
		},
		task: { aggregate: vi.fn().mockResolvedValue({ _max: { position: null } }) },
	}
	return {
		tx,
		board: {
			findUnique: vi
				.fn()
				.mockResolvedValue({ projectId: 'project', project: { teamId: 'team' } }),
		},
		teamMember: { findUnique: vi.fn().mockResolvedValue({ role: 'OWNER' }) },
		$transaction: vi
			.fn()
			.mockImplementation((operation: (client: typeof tx) => Promise<unknown>) =>
				operation(tx),
			),
	}
}

const databaseError = (code: string, sqlCode?: string) =>
	new Prisma.PrismaClientKnownRequestError('Database error', {
		code,
		clientVersion: '7.4.0',
		...(sqlCode ? { meta: { code: sqlCode } } : {}),
	})

describe('BoardColumnsService', () => {
	let prisma: ReturnType<typeof createPrismaMock>
	let service: BoardColumnsService
	beforeEach(() => {
		prisma = createPrismaMock()
		service = new BoardColumnsService(prisma as unknown as PrismaService)
	})

	it('rejects a missing board before starting a transaction', async () => {
		prisma.board.findUnique.mockResolvedValue(null)
		await expect(
			service.create('missing', 'user', { key: 'KEY', title: 'Title' }),
		).rejects.toThrow(NotFoundException)
		expect(prisma.$transaction).not.toHaveBeenCalled()
	})

	it.each([null, { role: 'MEMBER' }])(
		'rejects unauthorized membership %j before writing',
		async (member) => {
			prisma.teamMember.findUnique.mockResolvedValue(member)
			await expect(
				service.create('board', 'user', { key: 'KEY', title: 'Title' }),
			).rejects.toThrow(ForbiddenException)
			expect(prisma.$transaction).not.toHaveBeenCalled()
		},
	)

	it('detects a board removed between authorization and locking', async () => {
		prisma.tx.$queryRaw.mockResolvedValue([])
		await expect(
			service.create('board', 'user', { key: 'KEY', title: 'Title' }),
		).rejects.toThrow(NotFoundException)
		expect(prisma.tx.boardColumn.create).not.toHaveBeenCalled()
	})

	it.each(['OWNER', 'ADMIN'])('allows %s to append a column', async (role) => {
		prisma.teamMember.findUnique.mockResolvedValue({ role })
		expect(
			await service.create('board', 'user', { key: 'KEY', title: 'Title' }),
		).toMatchObject({ id: 'new', position: 2 })
	})

	it('inserts at the requested position even if old positions are negative', async () => {
		prisma.tx.boardColumn.findMany.mockResolvedValue([
			column('first', -1),
			column('second', -2),
		])
		await service.create('board', 'user', { key: 'KEY', title: 'Title', position: 0 })
		expect(prisma.tx.boardColumn.update).toHaveBeenLastCalledWith({
			where: { id: 'second' },
			data: { position: 2 },
		})
	})

	it('rejects insertion beyond the current column count without writing', async () => {
		await expect(
			service.create('board', 'user', { key: 'KEY', title: 'Title', position: 3 }),
		).rejects.toThrow(BadRequestException)
		expect(prisma.tx.boardColumn.create).not.toHaveBeenCalled()
	})

	it('allows custom key and title changes', async () => {
		expect(
			await service.update('board', 'first', 'user', { key: 'CUSTOM', title: 'Custom' }),
		).toMatchObject({ key: 'CUSTOM', title: 'Custom' })
	})

	it('protects system keys but accepts the same key or a new title', async () => {
		prisma.tx.boardColumn.findMany.mockResolvedValue([column('TODO', 0, true)])
		await expect(
			service.update('board', 'TODO', 'user', { key: 'OTHER' }),
		).rejects.toThrow(ConflictException)
		expect(prisma.tx.boardColumn.update).not.toHaveBeenCalled()
		expect(await service.update('board', 'TODO', 'user', { key: 'TODO' })).toMatchObject({
			key: 'TODO',
		})
		expect(
			await service.update('board', 'TODO', 'user', { title: 'Waiting' }),
		).toMatchObject({ title: 'Waiting' })
	})

	it('rejects a missing column on update or deletion', async () => {
		await expect(
			service.update('board', 'foreign', 'user', { title: 'Title' }),
		).rejects.toThrow(NotFoundException)
		await expect(
			service.remove('board', 'foreign', 'user', { targetColumnId: 'second' }),
		).rejects.toThrow(NotFoundException)
		expect(prisma.tx.boardColumn.update).not.toHaveBeenCalled()
		expect(prisma.tx.boardColumn.delete).not.toHaveBeenCalled()
	})

	it('leaves an already dense order untouched', async () => {
		await service.reorder('board', 'user', { columnIds: ['first', 'second'] })
		expect(prisma.tx.boardColumn.update).not.toHaveBeenCalled()
	})

	it('reorders all columns as a complete permutation', async () => {
		await service.reorder('board', 'user', { columnIds: ['second', 'first'] })
		expect(prisma.tx.boardColumn.update).toHaveBeenLastCalledWith({
			where: { id: 'first' },
			data: { position: 1 },
		})
	})

	it.each([['first'], ['first', 'first'], ['first', 'foreign']])(
		'rejects incomplete, duplicate or foreign order %j',
		async (...columnIds) => {
			await expect(service.reorder('board', 'user', { columnIds })).rejects.toThrow(
				BadRequestException,
			)
			expect(prisma.tx.boardColumn.update).not.toHaveBeenCalled()
		},
	)

	it('protects the last column and every system column', async () => {
		prisma.tx.boardColumn.findMany.mockResolvedValue([column('first', 0)])
		await expect(
			service.remove('board', 'first', 'user', { targetColumnId: 'second' }),
		).rejects.toThrow(ConflictException)
		prisma.tx.boardColumn.findMany.mockResolvedValue([
			column('first', 0, true),
			column('second', 1),
		])
		await expect(
			service.remove('board', 'first', 'user', { targetColumnId: 'second' }),
		).rejects.toThrow(ConflictException)
		expect(prisma.tx.boardColumn.delete).not.toHaveBeenCalled()
	})

	it('requires another target belonging to the same board', async () => {
		await expect(
			service.remove('board', 'first', 'user', { targetColumnId: 'first' }),
		).rejects.toThrow(BadRequestException)
		await expect(
			service.remove('board', 'first', 'user', { targetColumnId: 'foreign' }),
		).rejects.toThrow(NotFoundException)
		expect(prisma.tx.boardColumn.delete).not.toHaveBeenCalled()
	})

	it('deletes an empty column without touching tasks', async () => {
		prisma.tx.$queryRaw.mockResolvedValueOnce([{ id: 'board' }]).mockResolvedValueOnce([])
		await service.remove('board', 'first', 'user', { targetColumnId: 'second' })
		expect(prisma.tx.task.aggregate).not.toHaveBeenCalled()
		expect(prisma.tx.$executeRaw).not.toHaveBeenCalled()
		expect(prisma.tx.boardColumn.delete).toHaveBeenCalledWith({ where: { id: 'first' } })
	})

	it.each([
		{ target: column('second', 1), max: null },
		{ target: column('second', 1), max: 8 },
		{ target: column('DONE', 1, true), max: -2 },
		{ target: column('CUSTOM_SYSTEM', 1, true), max: 0 },
	])(
		'transfers tasks to target $target.key after position $max',
		async ({ target, max }) => {
			prisma.tx.boardColumn.findMany.mockResolvedValue([column('first', 0), target])
			prisma.tx.$queryRaw
				.mockResolvedValueOnce([{ id: 'board' }])
				.mockResolvedValueOnce([{ id: 'task', position: 1 }])
			prisma.tx.task.aggregate.mockResolvedValue({ _max: { position: max } })
			await service.remove('board', 'first', 'user', { targetColumnId: target.id })
			expect(prisma.tx.$executeRaw).toHaveBeenCalledOnce()
			expect(prisma.tx.boardColumn.delete).toHaveBeenCalledOnce()
		},
	)

	it('rejects a transfer exceeding int32 before moving or deleting anything', async () => {
		prisma.tx.$queryRaw
			.mockResolvedValueOnce([{ id: 'board' }])
			.mockResolvedValueOnce([{ id: 'task', position: 1 }])
		prisma.tx.task.aggregate.mockResolvedValue({ _max: { position: 2147483647 } })
		await expect(
			service.remove('board', 'first', 'user', { targetColumnId: 'second' }),
		).rejects.toThrow(ConflictException)
		expect(prisma.tx.$executeRaw).not.toHaveBeenCalled()
		expect(prisma.tx.boardColumn.delete).not.toHaveBeenCalled()
	})

	it.each([
		['P2002', undefined, ConflictException],
		['P2025', undefined, NotFoundException],
		['P2003', undefined, ConflictException],
		['P2034', undefined, ConflictException],
		['P2010', '23503', ConflictException],
		['P2010', '40P01', ConflictException],
		['P2010', '40001', ConflictException],
	] as const)(
		'maps database error %s/%s after transaction rollback',
		async (
			code: string,
			sqlCode: string | undefined,
			exception: typeof ConflictException | typeof NotFoundException,
		) => {
			prisma.$transaction.mockRejectedValue(databaseError(code, sqlCode))
			await expect(
				service.create('board', 'user', { key: 'KEY', title: 'Title' }),
			).rejects.toThrow(exception)
		},
	)

	it.each([
		new Error('Unavailable'),
		databaseError('P2024'),
		databaseError('P2010', '42601'),
	])('preserves unexpected failures', async (error) => {
		prisma.$transaction.mockRejectedValue(error)
		await expect(
			service.create('board', 'user', { key: 'KEY', title: 'Title' }),
		).rejects.toBe(error)
	})
})
