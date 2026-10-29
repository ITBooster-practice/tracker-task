import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '../../../generated/prisma/client'
import { PrismaService } from '../../../prisma/prisma.service'
import { BoardsService } from '../../../src/boards/boards.service'

function createPrismaMock() {
	return {
		teamMember: { findUnique: vi.fn().mockResolvedValue({ role: 'OWNER' }) },
		project: { findFirst: vi.fn().mockResolvedValue({ id: 'project' }) },
		board: {
			findMany: vi.fn().mockResolvedValue([]),
			findUnique: vi.fn().mockResolvedValue({ isDefault: false }),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
	}
}

const prismaError = (code: string) =>
	new Prisma.PrismaClientKnownRequestError('Database conflict', {
		code,
		clientVersion: '7.4.0',
	})

describe('BoardsService', () => {
	let prisma: ReturnType<typeof createPrismaMock>
	let service: BoardsService

	beforeEach(() => {
		prisma = createPrismaMock()
		service = new BoardsService(prisma as unknown as PrismaService)
	})

	it('allows a member to list only the requested project with ordered columns', async () => {
		prisma.teamMember.findUnique.mockResolvedValue({ role: 'MEMBER' })
		prisma.board.findMany.mockResolvedValue([{ id: 'board', columns: [] }])
		expect(await service.findAll('team', 'project', 'user')).toEqual([
			{ id: 'board', columns: [], taskCount: 0 },
		])
		expect(prisma.project.findFirst).toHaveBeenCalledWith({
			where: { id: 'project', teamId: 'team' },
			select: { id: true },
		})
		expect(prisma.board.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { projectId: 'project' },
				include: {
					columns: {
						orderBy: { position: 'asc' },
						include: { _count: { select: { tasks: true } } },
					},
				},
			}),
		)
	})

	it('считает задачи во всех колонках, не раскрывая служебный _count', async () => {
		prisma.board.findMany.mockResolvedValue([
			{
				id: 'board',
				columns: [
					{ id: 'one', _count: { tasks: 2 } },
					{ id: 'two', _count: { tasks: 3 } },
				],
			},
		])
		expect(await service.findAll('team', 'project', 'user')).toEqual([
			{ id: 'board', taskCount: 5, columns: [{ id: 'one' }, { id: 'two' }] },
		])
	})

	it.each(['OWNER', 'ADMIN'])(
		'allows %s to create a regular board with initial editable columns',
		async (role) => {
			prisma.teamMember.findUnique.mockResolvedValue({ role })
			prisma.board.create.mockResolvedValue({ id: 'board', name: 'Support', columns: [] })
			expect(
				await service.create('team', 'project', 'user', { name: 'Support' }),
			).toEqual({ id: 'board', name: 'Support', columns: [], taskCount: 0 })
			expect(prisma.board.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						projectId: 'project',
						name: 'Support',
						isDefault: false,
						columns: {
							create: expect.arrayContaining([
								expect.objectContaining({ key: 'TODO', isSystem: false }),
							]),
						},
					}),
				}),
			)
		},
	)

	it('rejects a non-member before accessing project data', async () => {
		prisma.teamMember.findUnique.mockResolvedValue(null)
		await expect(service.findAll('team', 'project', 'user')).rejects.toThrow(
			ForbiddenException,
		)
		expect(prisma.project.findFirst).not.toHaveBeenCalled()
		expect(prisma.board.findMany).not.toHaveBeenCalled()
	})

	it('does not allow access to a missing or foreign-team project', async () => {
		prisma.project.findFirst.mockResolvedValue(null)
		await expect(service.findAll('team', 'foreign', 'user')).rejects.toThrow(
			NotFoundException,
		)
		expect(prisma.board.findMany).not.toHaveBeenCalled()
	})

	it('rejects every mutation by a member without writing data', async () => {
		prisma.teamMember.findUnique.mockResolvedValue({ role: 'MEMBER' })
		await expect(
			service.create('team', 'project', 'user', { name: 'New' }),
		).rejects.toThrow(ForbiddenException)
		await expect(
			service.update('team', 'project', 'board', 'user', { name: 'New' }),
		).rejects.toThrow(ForbiddenException)
		await expect(service.remove('team', 'project', 'board', 'user')).rejects.toThrow(
			ForbiddenException,
		)
		expect(prisma.board.create).not.toHaveBeenCalled()
		expect(prisma.board.update).not.toHaveBeenCalled()
		expect(prisma.board.delete).not.toHaveBeenCalled()
	})

	it('renames only a board in the requested project', async () => {
		prisma.board.update.mockResolvedValue({ id: 'board', name: 'Renamed', columns: [] })
		expect(
			await service.update('team', 'project', 'board', 'user', { name: 'Renamed' }),
		).toEqual({ id: 'board', name: 'Renamed', columns: [], taskCount: 0 })
		expect(prisma.board.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: 'board', projectId: 'project' },
				data: { name: 'Renamed' },
			}),
		)
	})

	it('deletes only a non-default board inside the requested project', async () => {
		expect(await service.remove('team', 'project', 'board', 'user')).toBeUndefined()
		expect(prisma.board.delete).toHaveBeenCalledWith({
			where: { id: 'board', projectId: 'project', isDefault: false },
		})
	})

	it('does not delete the default board', async () => {
		prisma.board.findUnique.mockResolvedValue({ isDefault: true })
		await expect(service.remove('team', 'project', 'board', 'user')).rejects.toThrow(
			ConflictException,
		)
		expect(prisma.board.delete).not.toHaveBeenCalled()
	})

	it('returns not found for a foreign or missing board', async () => {
		prisma.board.findUnique.mockResolvedValue(null)
		await expect(service.remove('team', 'project', 'missing', 'user')).rejects.toThrow(
			NotFoundException,
		)
		expect(prisma.board.delete).not.toHaveBeenCalled()
	})

	it('reports duplicate names as conflicts on create and rename', async () => {
		prisma.board.create.mockRejectedValue(prismaError('P2002'))
		prisma.board.update.mockRejectedValue(prismaError('P2002'))
		await expect(
			service.create('team', 'project', 'user', { name: 'Taken' }),
		).rejects.toThrow(ConflictException)
		await expect(
			service.update('team', 'project', 'board', 'user', { name: 'Taken' }),
		).rejects.toThrow(ConflictException)
	})

	it('handles a concurrent removal of the project or board', async () => {
		prisma.board.create.mockRejectedValue(prismaError('P2003'))
		prisma.board.update.mockRejectedValue(prismaError('P2025'))
		prisma.board.delete.mockRejectedValue(prismaError('P2025'))
		await expect(
			service.create('team', 'project', 'user', { name: 'New' }),
		).rejects.toThrow(NotFoundException)
		await expect(
			service.update('team', 'project', 'board', 'user', { name: 'New' }),
		).rejects.toThrow(NotFoundException)
		await expect(service.remove('team', 'project', 'board', 'user')).rejects.toThrow(
			NotFoundException,
		)
	})

	it('reports a board with tasks as a deletion conflict', async () => {
		prisma.board.delete.mockRejectedValue(prismaError('P2003'))
		await expect(service.remove('team', 'project', 'board', 'user')).rejects.toThrow(
			ConflictException,
		)
	})

	it.each([new Error('Unavailable'), prismaError('P2024')])(
		'keeps unexpected failures visible',
		async (error) => {
			prisma.board.create.mockRejectedValue(error)
			await expect(
				service.create('team', 'project', 'user', { name: 'New' }),
			).rejects.toBe(error)
		},
	)
})
