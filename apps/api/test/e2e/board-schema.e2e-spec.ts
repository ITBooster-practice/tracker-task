import { randomUUID } from 'node:crypto'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { PrismaService } from '../../prisma/prisma.service'
import { TasksService } from '../../src/tasks/tasks.service'
import { defaultBoardData } from '../../src/boards/default-board'

describe('Board schema (e2e)', () => {
	const prisma = new PrismaService()
	const userId = randomUUID()
	const teamId = randomUUID()
	let projectId: string
	let otherProjectId: string

	beforeAll(async () => {
		await prisma.$connect()
		await prisma.user.create({
			data: {
				id: userId,
				email: `board-schema-${userId}@example.com`,
				password: 'unused',
			},
		})
		await prisma.team.create({
			data: {
				id: teamId,
				name: 'Board schema tests',
				members: { create: { userId, role: 'OWNER' } },
			},
		})
	})

	beforeEach(async () => {
		projectId = randomUUID()
		otherProjectId = randomUUID()
		await prisma.project.createMany({
			data: [projectId, otherProjectId].map((id) => ({
				id,
				name: id,
				teamId,
				createdById: userId,
			})),
		})
	})

	afterEach(async () => {
		await prisma.project.deleteMany({ where: { teamId } })
	})

	afterAll(async () => {
		try {
			await prisma.team.deleteMany({ where: { id: teamId } })
			await prisma.user.deleteMany({ where: { id: userId } })
		} finally {
			await prisma.$disconnect()
		}
	})

	function createBoard(ownerProjectId = projectId, name = 'Development') {
		return prisma.board.create({
			data: {
				projectId: ownerProjectId,
				name,
				columns: {
					create: { key: 'TODO', title: 'К выполнению', position: 0, isSystem: true },
				},
			},
			include: { columns: true },
		})
	}

	function createTask(ownerProjectId: string, boardColumnId: string) {
		return prisma.task.create({
			data: {
				title: 'Existing task',
				projectId: ownerProjectId,
				createdById: userId,
				boardColumnId,
			},
		})
	}

	it('поддерживает несколько досок и одинаковые ключи/позиции в разных досках', async () => {
		const first = await createBoard()
		const second = await createBoard(projectId, 'Support')
		const other = await createBoard(otherProjectId)

		expect(first.isDefault).toBe(false)
		expect(first.createdAt).toBeInstanceOf(Date)
		expect(first.updatedAt).toBeInstanceOf(Date)
		expect(new Set([first.id, second.id, other.id]).size).toBe(3)
		for (const board of [first, second, other]) {
			expect(board.columns[0]).toMatchObject({
				boardId: board.id,
				projectId: board.projectId,
				key: 'TODO',
				position: 0,
				isSystem: true,
			})
		}
	})

	it('запрещает повторное имя доски внутри одного проекта', async () => {
		await createBoard()
		await expect(createBoard()).rejects.toMatchObject({ code: 'P2002' })
	})

	it.each([
		{ key: 'TODO', position: 1 },
		{ key: 'CUSTOM', position: 0 },
	])('запрещает повтор ключа или позиции колонки: %j', async (duplicate) => {
		const board = await createBoard()
		await expect(
			prisma.boardColumn.create({
				data: { boardId: board.id, projectId, title: 'Duplicate', ...duplicate },
			}),
		).rejects.toMatchObject({ code: 'P2002' })
	})

	it('не позволяет связать доску, колонку или задачу с чужим проектом', async () => {
		const board = await createBoard()
		await expect(
			prisma.boardColumn.create({
				data: {
					boardId: board.id,
					projectId: otherProjectId,
					key: 'CUSTOM',
					title: 'Invalid',
					position: 1,
				},
			}),
		).rejects.toMatchObject({ code: 'P2003' })
		await expect(createTask(otherProjectId, board.columns[0].id)).rejects.toMatchObject({
			code: 'P2003',
		})

		const task = await createTask(projectId, board.columns[0].id)
		await expect(
			prisma.task.update({
				where: { id: task.id },
				data: { projectId: otherProjectId },
			}),
		).rejects.toMatchObject({ code: 'P2003' })
	})

	it('отклоняет ссылки на несуществующий проект и колонку', async () => {
		await expect(createBoard(randomUUID())).rejects.toMatchObject({ code: 'P2003' })
		await expect(createTask(projectId, randomUUID())).rejects.toMatchObject({
			code: 'P2003',
		})
	})

	it('сохраняет CRUD задач и прежний ответ API после обязательной привязки к колонке', async () => {
		const defaultBoard = await prisma.board.create({
			data: { projectId, ...defaultBoardData() },
			include: { columns: true },
		})
		const service = new TasksService(prisma)
		const created = await service.create(teamId, projectId, userId, {
			title: 'Legacy create',
		})
		expect(created).not.toHaveProperty('boardColumnId')
		expect(
			await prisma.task.findUniqueOrThrow({ where: { id: created.id } }),
		).toMatchObject({
			boardColumnId: defaultBoard.columns.find((column) => column.key === 'TODO')!.id,
			status: 'TODO',
			position: 1,
		})

		const board = await createBoard()
		await prisma.task.update({
			where: { id: created.id },
			data: { boardColumnId: board.columns[0].id },
		})
		const read = await service.findOne(teamId, projectId, created.id, userId)
		const list = await service.findAll(
			teamId,
			projectId,
			userId,
			{},
			{ page: 1, limit: 10 },
		)
		const updated = await service.update(teamId, projectId, created.id, userId, {
			title: 'Updated',
		})
		expect(
			await prisma.task.findUniqueOrThrow({ where: { id: created.id } }),
		).toMatchObject({
			boardColumnId: board.columns[0].id,
		})
		const moved = await service.moveTask(teamId, projectId, created.id, userId, {
			status: 'IN_PROGRESS',
			position: 2,
		})
		const columns = await service.getBoard(teamId, projectId, userId)
		const boardTask = columns.find((column) => column.status === 'IN_PROGRESS')!.tasks[0]
		for (const task of [read, list.data[0], updated, moved, boardTask]) {
			expect(task.id).toBe(created.id)
			expect(task).not.toHaveProperty('boardColumnId')
		}
		expect(updated.title).toBe('Updated')
		expect(
			await prisma.task.findUniqueOrThrow({ where: { id: created.id } }),
		).toMatchObject({
			boardColumnId: defaultBoard.columns.find((column) => column.key === 'IN_PROGRESS')!
				.id,
		})
		expect(moved).toMatchObject({ status: 'IN_PROGRESS', position: 2 })
		await service.remove(teamId, projectId, created.id, userId)
		expect(await prisma.task.findUnique({ where: { id: created.id } })).toBeNull()
	})

	it('требует перенести задачи перед удалением занятой колонки или доски', async () => {
		const board = await createBoard()
		const task = await createTask(projectId, board.columns[0].id)
		await expect(
			prisma.boardColumn.delete({ where: { id: board.columns[0].id } }),
		).rejects.toMatchObject({ code: 'P2003' })
		await expect(prisma.board.delete({ where: { id: board.id } })).rejects.toMatchObject({
			code: 'P2003',
		})
		expect(await prisma.task.findUniqueOrThrow({ where: { id: task.id } })).toMatchObject(
			{ boardColumnId: board.columns[0].id },
		)

		const target = await createBoard(projectId, 'Target')
		await prisma.task.update({
			where: { id: task.id },
			data: { boardColumnId: target.columns[0].id },
		})
		await prisma.board.delete({ where: { id: board.id } })
		expect(await prisma.boardColumn.count({ where: { boardId: board.id } })).toBe(0)
		expect(await prisma.task.findUniqueOrThrow({ where: { id: task.id } })).toMatchObject(
			{ boardColumnId: target.columns[0].id },
		)
	})

	it('удаляет доски, колонки и задачи вместе с проектом, сохраняя другой проект', async () => {
		const board = await createBoard()
		const task = await createTask(projectId, board.columns[0].id)
		const other = await createBoard(otherProjectId)
		await createTask(otherProjectId, other.columns[0].id)
		await prisma.project.delete({ where: { id: projectId } })

		expect(await prisma.board.findUnique({ where: { id: board.id } })).toBeNull()
		expect(
			await prisma.boardColumn.findUnique({ where: { id: board.columns[0].id } }),
		).toBeNull()
		expect(await prisma.task.findUnique({ where: { id: task.id } })).toBeNull()
		expect(await prisma.board.count({ where: { projectId: otherProjectId } })).toBe(1)
		expect(await prisma.task.count({ where: { projectId: otherProjectId } })).toBe(1)
	})
})
