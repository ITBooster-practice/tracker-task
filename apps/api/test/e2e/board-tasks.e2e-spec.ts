import type { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { FEATURE_KEYS, type BoardView, type MoveTaskToColumn } from '@repo/types'
import type { Redis } from 'ioredis'
import { cleanupOpenApiDoc } from 'nestjs-zod'
import type { Server } from 'node:http'
import { setTimeout } from 'node:timers/promises'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { Prisma } from '../../generated/prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { boardData, defaultBoardData } from '../../src/boards/default-board'
import { createTestApp, registerAndLogin, resetE2eState } from '../helpers/e2e.helpers'

describe('Board task payload and moves (e2e)', () => {
	let app: INestApplication
	let server: Server
	let prisma: PrismaService
	let redis: Redis
	let ownerCookies: string
	let adminCookies: string
	let memberCookies: string
	let outsiderCookies: string
	let ownerId: string
	let memberId: string
	let outsiderId: string
	let teamId: string
	let otherTeamId: string
	let projectId: string
	let otherProjectId: string
	let mainBoard: Awaited<ReturnType<typeof createBoard>>
	let extraBoard: Awaited<ReturnType<typeof createBoard>>
	const path = (team = teamId, project = projectId) =>
		`/teams/${team}/projects/${project}/tasks`

	beforeAll(async () => {
		const testApp = await createTestApp()
		app = testApp.app
		server = app.getHttpServer() as Server
		prisma = testApp.prisma
		redis = testApp.redisClient
		await resetE2eState(prisma, redis)
		ownerCookies = (await registerAndLogin(app, 'board-tasks-owner@example.com')).cookies
		adminCookies = (await registerAndLogin(app, 'board-tasks-admin@example.com')).cookies
		memberCookies = (await registerAndLogin(app, 'board-tasks-member@example.com'))
			.cookies
		outsiderCookies = (await registerAndLogin(app, 'board-tasks-outsider@example.com'))
			.cookies
		ownerId = (
			await prisma.user.findUniqueOrThrow({
				where: { email: 'board-tasks-owner@example.com' },
			})
		).id
		memberId = (
			await prisma.user.findUniqueOrThrow({
				where: { email: 'board-tasks-member@example.com' },
			})
		).id
		outsiderId = (
			await prisma.user.findUniqueOrThrow({
				where: { email: 'board-tasks-outsider@example.com' },
			})
		).id
		const adminId = (
			await prisma.user.findUniqueOrThrow({
				where: { email: 'board-tasks-admin@example.com' },
			})
		).id
		teamId = (
			await prisma.team.create({
				data: {
					name: 'Board task team',
					members: {
						create: [
							{ userId: ownerId, role: 'OWNER' },
							{ userId: memberId, role: 'MEMBER' },
							{ userId: adminId, role: 'ADMIN' },
						],
					},
				},
			})
		).id
		otherTeamId = (
			await prisma.team.create({
				data: {
					name: 'Other board task team',
					members: { create: { userId: ownerId, role: 'OWNER' } },
				},
			})
		).id
		projectId = (
			await prisma.project.create({
				data: { name: 'Board tasks', teamId, createdById: ownerId },
			})
		).id
		otherProjectId = (
			await prisma.project.create({
				data: { name: 'Other board tasks', teamId: otherTeamId, createdById: ownerId },
			})
		).id
	})

	async function createBoard(name = 'Other', project = projectId, isDefault = false) {
		return prisma.board.create({
			data: {
				projectId: project,
				...(isDefault ? defaultBoardData() : boardData(name)),
			},
			include: { columns: { orderBy: { position: 'asc' } } },
		})
	}

	beforeEach(async () => {
		await prisma.featureFlag.updateMany({
			where: {
				key: { in: [FEATURE_KEYS.PROJECTS, FEATURE_KEYS.TASKS, FEATURE_KEYS.BOARDS] },
			},
			data: { enabled: true },
		})
		await prisma.task.deleteMany({
			where: { projectId: { in: [projectId, otherProjectId] } },
		})
		await prisma.board.deleteMany({
			where: { projectId: { in: [projectId, otherProjectId] } },
		})
		mainBoard = await createBoard('Main', projectId, true)
		extraBoard = await createBoard('Development')
	})

	afterAll(async () => {
		try {
			if (prisma && redis) await resetE2eState(prisma, redis)
		} finally {
			if (app) await app.close()
			if (prisma) await prisma.$disconnect()
		}
	})

	function task(columnId: string, title: string, position: number, project = projectId) {
		return prisma.task.create({
			data: {
				projectId: project,
				boardColumnId: columnId,
				title,
				position,
				createdById: ownerId,
				description: 'Keep description',
				assigneeId: ownerId,
				status: 'IN_REVIEW',
				priority: 'HIGH',
				dueDate: new Date('2026-12-01T12:00:00Z'),
			},
		})
	}

	const list = (columnId: string) =>
		prisma.task.findMany({
			where: { boardColumnId: columnId },
			orderBy: [{ position: 'asc' }, { id: 'asc' }],
		})
	const move = async (
		taskId: string,
		fromColumnId: string,
		toColumnId: string,
		position = 0,
		status = 200,
		expectedVersion?: number,
	) => {
		const version =
			expectedVersion ??
			(await prisma.task.findUnique({ where: { id: taskId }, select: { version: true } }))
				?.version ??
			0
		return request(server)
			.patch(`${path()}/${taskId}/move`)
			.set('Cookie', memberCookies)
			.send({ fromColumnId, toColumnId, position, expectedVersion: version })
			.expect(status)
	}
	const moveWithMetadata = (
		moving: { id: string; boardColumnId: string; version: number },
		toColumnId: string,
		changes: Pick<MoveTaskToColumn, 'priority' | 'assigneeId'>,
		cookies = ownerCookies,
	) =>
		request(server)
			.patch(`${path()}/${moving.id}/move`)
			.set('Cookie', cookies)
			.send({
				fromColumnId: moving.boardColumnId,
				toColumnId,
				position: 0,
				expectedVersion: moving.version,
				...changes,
			})
	async function view(boardId: string, cookies = memberCookies) {
		const response = await request(server)
			.get(`${path()}/board`)
			.query({ boardId })
			.set('Cookie', cookies)
			.expect(200)
		return response.body as BoardView
	}
	async function expectOrder(columnId: string, taskIds: string[]) {
		const tasks = await list(columnId)
		expect(tasks.map((item) => item.id)).toEqual(taskIds)
		expect(tasks.map((item) => item.position)).toEqual(
			taskIds.map((_, position) => position),
		)
	}

	it('returns only the selected board, including empty columns, with ordered tasks and serialized dates', async () => {
		const [first, second] = extraBoard.columns
		await prisma.boardColumn.update({ where: { id: first.id }, data: { position: -1 } })
		const later = await task(first.id, 'Later', 9)
		const tied = await Promise.all([
			task(first.id, 'Tie A', 1),
			task(first.id, 'Tie B', 1),
		])
		tied.sort((a, b) => a.id.localeCompare(b.id))
		const otherColumn = await task(second.id, 'Another column', 0)
		await task(mainBoard.columns[0].id, 'Another board', 0)
		const result = await view(extraBoard.id)
		expect(result.board).toEqual({
			id: extraBoard.id,
			projectId,
			name: 'Development',
			isDefault: false,
			createdAt: extraBoard.createdAt.toISOString(),
			updatedAt: extraBoard.updatedAt.toISOString(),
		})
		expect(result.columns.map((column) => column.id)).toEqual(
			extraBoard.columns.map((column) => column.id),
		)
		expect(result.columns[0].tasks.map((item) => item.id)).toEqual([
			...tied.map((item) => item.id),
			later.id,
		])
		expect(result.columns[1].tasks.map((item) => item.id)).toEqual([otherColumn.id])
		expect(result.columns.slice(2).every((column) => column.tasks.length === 0)).toBe(
			true,
		)
		expect(result.columns[0].tasks[0]).toMatchObject({
			boardColumnId: first.id,
			projectId,
			createdById: ownerId,
			status: 'IN_REVIEW',
			createdAt: expect.any(String),
			updatedAt: expect.any(String),
			dueDate: '2026-12-01T12:00:00.000Z',
		})
	})

	it('requires boardId and rejects status-based moves without changing the task', async () => {
		const created = await request(server)
			.post(path())
			.set('Cookie', ownerCookies)
			.send({ title: 'Unchanged task' })
			.expect(201)
		const taskId = (created.body as { id: string }).id
		const original = await prisma.task.findUniqueOrThrow({ where: { id: taskId } })
		await request(server)
			.patch(`${path()}/${taskId}/move`)
			.set('Cookie', memberCookies)
			.send({ status: 'IN_PROGRESS', position: 1 })
			.expect(400)
		await request(server).get(`${path()}/board`).set('Cookie', memberCookies).expect(400)
		expect(await prisma.task.findUniqueOrThrow({ where: { id: taskId } })).toEqual(
			original,
		)
	})

	it('allows an admin to read a board and move tasks created by another user', async () => {
		const fromColumnId = extraBoard.columns[0].id
		const toColumnId = extraBoard.columns[1].id
		const moving = await task(fromColumnId, 'Admin move', 0)
		const before = await view(extraBoard.id, adminCookies)
		expect(
			before.columns
				.find((column) => column.id === fromColumnId)
				?.tasks.map((item) => item.id),
		).toEqual([moving.id])
		const moved = await request(server)
			.patch(`${path()}/${moving.id}/move`)
			.set('Cookie', adminCookies)
			.send({ fromColumnId, toColumnId, position: 0, expectedVersion: moving.version })
			.expect(200)
		expect(moved.body).toMatchObject({
			id: moving.id,
			boardColumnId: toColumnId,
			position: 0,
			version: moving.version + 1,
			priority: moving.priority,
			type: moving.type,
		})
		const after = await view(extraBoard.id, adminCookies)
		expect(after.columns.find((column) => column.id === fromColumnId)?.tasks).toEqual([])
		expect(
			after.columns
				.find((column) => column.id === toColumnId)
				?.tasks.map((item) => item.id),
		).toEqual([moving.id])
		await expectOrder(toColumnId, [moving.id])
	})

	it.each(['creator', 'admin', 'owner'])(
		'atomically changes priority and column for a task %s',
		async (role) => {
			const [source, target] = extraBoard.columns
			const moving = await task(source.id, 'Priority transfer', 5)
			const neighbour = await task(target.id, 'Target neighbour', 8)
			if (role === 'creator') {
				await prisma.task.update({
					where: { id: moving.id },
					data: { createdById: memberId },
				})
			}
			const cookies =
				role === 'creator'
					? memberCookies
					: role === 'admin'
						? adminCookies
						: ownerCookies
			const result = await moveWithMetadata(
				moving,
				target.id,
				{ priority: 'LOW' },
				cookies,
			).expect(200)
			expect(result.body).toMatchObject({
				boardColumnId: target.id,
				position: 0,
				priority: 'LOW',
				assigneeId: ownerId,
				version: moving.version + 1,
			})
			expect(
				await prisma.task.findUniqueOrThrow({ where: { id: moving.id } }),
			).toMatchObject({
				boardColumnId: target.id,
				priority: 'LOW',
				version: moving.version + 1,
			})
			await expectOrder(target.id, [moving.id, neighbour.id])
		},
	)

	it.each(['assign', 'unassign'])(
		'atomically changes assignee and system column when asked to %s',
		async (action) => {
			const source = extraBoard.columns[0]
			const target = mainBoard.columns.find((column) => column.key === 'DONE')!
			const moving = await task(source.id, 'Assignee transfer', 0)
			const assigneeId = action === 'assign' ? memberId : null
			const result = await moveWithMetadata(moving, target.id, { assigneeId }).expect(200)
			expect(result.body).toMatchObject({
				boardColumnId: target.id,
				assigneeId,
				status: 'DONE',
				priority: 'HIGH',
				version: moving.version + 1,
			})
			expect(
				await prisma.task.findUniqueOrThrow({ where: { id: moving.id } }),
			).toMatchObject({
				boardColumnId: target.id,
				assigneeId,
				status: 'DONE',
				version: moving.version + 1,
			})
			await expectOrder(source.id, [])
			await expectOrder(target.id, [moving.id])
		},
	)

	it.each([
		{ priority: 'LOW' as const },
		{ assigneeId: null },
		{ assigneeId: 'other-user' },
	])(
		'keeps all tasks unchanged when a non-creator member changes metadata %j',
		async (changes) => {
			const [source, target] = extraBoard.columns
			const moving = await task(source.id, 'Protected transfer', 5)
			const neighbour = await task(target.id, 'Unchanged neighbour', 8)
			await moveWithMetadata(moving, target.id, changes, memberCookies).expect(403)
			expect(await prisma.task.findUniqueOrThrow({ where: { id: moving.id } })).toEqual(
				moving,
			)
			expect(
				await prisma.task.findUniqueOrThrow({ where: { id: neighbour.id } }),
			).toEqual(neighbour)
		},
	)

	it('allows a non-creator member to move with unchanged metadata', async () => {
		const [source, target] = extraBoard.columns
		const moving = await task(source.id, 'Unchanged metadata', 0)
		await moveWithMetadata(
			moving,
			target.id,
			{ priority: moving.priority, assigneeId: moving.assigneeId },
			memberCookies,
		).expect(200)
		await expectOrder(target.id, [moving.id])
	})

	it('updates metadata with one version increment when column and position stay unchanged', async () => {
		const source = extraBoard.columns[0]
		const moving = await task(source.id, 'Metadata only', 0)
		await moveWithMetadata(moving, source.id, {
			priority: 'CRITICAL',
			assigneeId: null,
		}).expect(200)
		expect(
			await prisma.task.findUniqueOrThrow({ where: { id: moving.id } }),
		).toMatchObject({
			boardColumnId: source.id,
			position: 0,
			priority: 'CRITICAL',
			assigneeId: null,
			version: moving.version + 1,
		})
	})

	it('rejects missing and non-team assignees without moving or changing metadata', async () => {
		const [source, target] = extraBoard.columns
		const moving = await task(source.id, 'Invalid assignee', 5)
		const neighbour = await task(target.id, 'Unchanged target', 8)
		for (const assigneeId of ['missing-user', outsiderId]) {
			await moveWithMetadata(moving, target.id, { priority: 'LOW', assigneeId }).expect(
				400,
			)
			expect(await prisma.task.findUniqueOrThrow({ where: { id: moving.id } })).toEqual(
				moving,
			)
			expect(
				await prisma.task.findUniqueOrThrow({ where: { id: neighbour.id } }),
			).toEqual(neighbour)
		}
	})

	it('rejects stale metadata moves without applying any part of the request', async () => {
		const [source, target] = extraBoard.columns
		const moving = await task(source.id, 'Before edit', 0)
		const edited = await prisma.task.update({
			where: { id: moving.id },
			data: { title: 'Concurrent edit', version: { increment: 1 } },
		})
		const response = await moveWithMetadata(moving, target.id, {
			priority: 'LOW',
			assigneeId: null,
		}).expect(409)
		expect(response.body.reason).toBe('VERSION_MISMATCH')
		expect(await prisma.task.findUniqueOrThrow({ where: { id: moving.id } })).toEqual(
			edited,
		)
		expect(await list(target.id)).toEqual([])
	})

	it('revokes board reads and moves immediately after team membership is removed', async () => {
		const moving = await task(extraBoard.columns[0].id, 'Keep after revocation', 0)
		const member = await prisma.user.findUniqueOrThrow({
			where: { email: 'board-tasks-member@example.com' },
		})
		const removed = await prisma.teamMember.delete({
			where: { teamId_userId: { teamId, userId: member.id } },
		})
		try {
			await request(server)
				.get(`${path()}/board`)
				.set('Cookie', memberCookies)
				.query({ boardId: extraBoard.id })
				.expect(403)
			await request(server)
				.patch(`${path()}/${moving.id}/move`)
				.set('Cookie', memberCookies)
				.send({
					fromColumnId: extraBoard.columns[0].id,
					toColumnId: extraBoard.columns[1].id,
					position: 0,
					expectedVersion: moving.version,
				})
				.expect(403)
			expect(await prisma.task.findUniqueOrThrow({ where: { id: moving.id } })).toEqual(
				moving,
			)
			expect((await list(extraBoard.columns[0].id)).map((item) => item.id)).toEqual([
				moving.id,
			])
			expect(await list(extraBoard.columns[1].id)).toEqual([])
		} finally {
			await prisma.teamMember.create({ data: removed })
		}
	})

	it('validates project, board and team boundaries for reads and moves', async () => {
		const foreign = await createBoard('Foreign', otherProjectId)
		const moving = await task(extraBoard.columns[0].id, 'Keep', 1)
		for (const boardId of ['missing', foreign.id]) {
			await request(server)
				.get(`${path()}/board`)
				.query({ boardId })
				.set('Cookie', ownerCookies)
				.expect(404)
		}
		await request(server)
			.get(`${path(teamId, otherProjectId)}/board`)
			.query({ boardId: foreign.id })
			.set('Cookie', ownerCookies)
			.expect(404)
		await request(server)
			.patch(`${path(teamId, otherProjectId)}/${moving.id}/move`)
			.set('Cookie', ownerCookies)
			.send({
				fromColumnId: extraBoard.columns[0].id,
				toColumnId: extraBoard.columns[1].id,
				position: 0,
				expectedVersion: moving.version,
			})
			.expect(404)
		await move(moving.id, extraBoard.columns[0].id, foreign.columns[0].id, 0, 404)
		const foreignTask = await task(
			foreign.columns[0].id,
			'Foreign task',
			0,
			otherProjectId,
		)
		await move(foreignTask.id, extraBoard.columns[0].id, extraBoard.columns[1].id, 0, 404)
		expect(await prisma.task.findUniqueOrThrow({ where: { id: moving.id } })).toEqual(
			moving,
		)
	})

	it.each(['outsider', 'unauthenticated'])(
		'rejects board access and moves by %s',
		async (role) => {
			const cookies = role === 'outsider' ? outsiderCookies : ''
			const status = cookies ? 403 : 401
			const moving = await task(extraBoard.columns[0].id, 'Keep', 1)
			await request(server)
				.get(`${path()}/board`)
				.query({ boardId: extraBoard.id })
				.set('Cookie', cookies)
				.expect(status)
			await request(server)
				.patch(`${path()}/${moving.id}/move`)
				.set('Cookie', cookies)
				.send({
					fromColumnId: extraBoard.columns[0].id,
					toColumnId: extraBoard.columns[1].id,
					position: 0,
					expectedVersion: moving.version,
				})
				.expect(status)
			expect(await prisma.task.findUniqueOrThrow({ where: { id: moving.id } })).toEqual(
				moving,
			)
		},
	)

	it.each([
		'boardId=',
		'boardId=%20',
		'boardId=a&boardId=b',
		'boardId[a]=b',
		'unexpected=a',
	])('rejects an invalid board query %s', async (query) => {
		await request(server)
			.get(`${path()}/board?${query}`)
			.set('Cookie', memberCookies)
			.expect(400)
	})

	it('reorders a sparse column in both directions and supports unchanged and last indexes', async () => {
		const source = extraBoard.columns[0].id
		const a = await task(source, 'A', 1)
		const b = await task(source, 'B', 7)
		const c = await task(source, 'C', 9)
		await move(c.id, source, source, 1)
		await expectOrder(source, [a.id, c.id, b.id])
		await move(a.id, source, source, 2)
		await expectOrder(source, [c.id, b.id, a.id])
		await move(a.id, source, source, 0)
		await move(a.id, source, source, 0)
		await expectOrder(source, [a.id, c.id, b.id])
	})

	it('moves between columns, compacts the source and synchronizes a system target status', async () => {
		const [source, target] = mainBoard.columns
		const a = await task(source.id, 'A', 4)
		const moving = await task(source.id, 'Moving', 9)
		const b = await task(source.id, 'B', 10)
		const x = await task(target.id, 'X', 2)
		const y = await task(target.id, 'Y', 8)
		const response = await move(moving.id, source.id, target.id, 1)
		expect(response.body).toMatchObject({
			...moving,
			version: moving.version + 1,
			boardColumnId: target.id,
			status: 'IN_PROGRESS',
			position: 1,
			dueDate: moving.dueDate!.toISOString(),
			createdAt: moving.createdAt.toISOString(),
			updatedAt: expect.any(String),
		})
		await expectOrder(source.id, [a.id, b.id])
		await expectOrder(target.id, [x.id, moving.id, y.id])
	})

	it('populates another board from the default board and preserves status for custom columns', async () => {
		const moving = await task(mainBoard.columns[0].id, 'Cross-board', 3)
		await prisma.boardColumn.update({
			where: { id: extraBoard.columns[0].id },
			data: { key: 'CUSTOM' },
		})
		const result = await move(
			moving.id,
			mainBoard.columns[0].id,
			extraBoard.columns[0].id,
		)
		expect(result.body).toMatchObject({
			id: moving.id,
			projectId,
			boardColumnId: extraBoard.columns[0].id,
			status: 'IN_REVIEW',
			position: 0,
		})
		expect(
			(await view(mainBoard.id)).columns.flatMap((column) => column.tasks),
		).toHaveLength(0)
		expect((await view(extraBoard.id)).columns[0].tasks.map((item) => item.id)).toEqual([
			moving.id,
		])
		await move(moving.id, extraBoard.columns[0].id, mainBoard.columns[3].id)
		expect(
			await prisma.task.findUniqueOrThrow({ where: { id: moving.id } }),
		).toMatchObject({ status: 'DONE', boardColumnId: mainBoard.columns[3].id, projectId })
	})

	it('accepts insertion at the end of another column', async () => {
		const [source, target] = extraBoard.columns
		const moving = await task(source.id, 'Moving', 2)
		const existing = await task(target.id, 'Existing', 5)
		await move(moving.id, source.id, target.id, 1)
		await expectOrder(source.id, [])
		await expectOrder(target.id, [existing.id, moving.id])
	})

	it('rejects missing tasks, columns, stale source and indexes outside the resulting list without writes', async () => {
		const [source, target] = extraBoard.columns
		const moving = await task(source.id, 'Keep', 7)
		await move('missing', source.id, target.id, 0, 404)
		await move(moving.id, source.id, 'missing', 0, 404)
		await move(moving.id, 'missing', target.id, 0, 404)
		await move(moving.id, target.id, target.id, 0, 409)
		await move(moving.id, extraBoard.columns[2].id, target.id, 0, 409)
		await move(moving.id, source.id, source.id, 1, 400)
		await move(moving.id, source.id, target.id, 1, 400)
		expect(await prisma.task.findUniqueOrThrow({ where: { id: moving.id } })).toEqual(
			moving,
		)
	})

	it('increments versions on edits and rejects moves from an older task snapshot', async () => {
		const [source, target] = extraBoard.columns
		const moving = await task(source.id, 'Before edit', 0)
		expect(moving.version).toBe(0)
		expect((await view(extraBoard.id)).columns[0].tasks[0].version).toBe(0)
		const edited = await request(server)
			.patch(`${path()}/${moving.id}`)
			.set('Cookie', ownerCookies)
			.send({ title: 'After edit' })
			.expect(200)
		expect(edited.body).toMatchObject({ version: 1, title: 'After edit' })
		const beforeMove = await prisma.task.findUniqueOrThrow({ where: { id: moving.id } })
		const stale = await move(moving.id, source.id, target.id, 0, 409, moving.version)
		expect(stale.body).toMatchObject({
			statusCode: 409,
			code: 'TASK_MOVE_CONFLICT',
			taskId: moving.id,
			reason: 'VERSION_MISMATCH',
		})
		expect(await prisma.task.findUniqueOrThrow({ where: { id: moving.id } })).toEqual(
			beforeMove,
		)
		const fresh = await move(moving.id, source.id, target.id, 0, 200, 1)
		expect(fresh.body).toMatchObject({
			version: 2,
			boardColumnId: target.id,
			title: 'After edit',
		})
	})

	it('allows only one of two same-column moves using the same version, including a no-op', async () => {
		const source = extraBoard.columns[0].id
		const moving = await task(source, 'No-op', 0)
		const payload = {
			fromColumnId: source,
			toColumnId: source,
			position: 0,
			expectedVersion: moving.version,
		}
		const attempts = await Promise.all(
			[0, 1].map(() =>
				request(server)
					.patch(`${path()}/${moving.id}/move`)
					.set('Cookie', memberCookies)
					.send(payload),
			),
		)
		expect(attempts.map((response) => response.status).sort()).toEqual([200, 409])
		expect(attempts.find((response) => response.status === 409)?.body).toMatchObject({
			code: 'TASK_MOVE_CONFLICT',
			reason: 'VERSION_MISMATCH',
			taskId: moving.id,
		})
		const stored = await prisma.task.findUniqueOrThrow({ where: { id: moving.id } })
		expect(stored).toMatchObject({ boardColumnId: source, position: 0, version: 1 })
		await move(moving.id, source, source, 0, 409, 0)
		expect(await prisma.task.findUniqueOrThrow({ where: { id: moving.id } })).toEqual(
			stored,
		)
	})

	it('invalidates neighbours changed by reorder and leaves untouched tasks at their version', async () => {
		const source = extraBoard.columns[0].id
		const a = await task(source, 'A', 0)
		const b = await task(source, 'B', 1)
		const c = await task(source, 'C', 2)
		const unaffected = await task(extraBoard.columns[1].id, 'Unchanged', 0)
		await move(a.id, source, source, 2, 200, a.version)
		const snapshot = await list(source)
		expect(snapshot.map((item) => [item.id, item.version])).toEqual([
			[b.id, 1],
			[c.id, 1],
			[a.id, 1],
		])
		expect(await prisma.task.findUniqueOrThrow({ where: { id: unaffected.id } })).toEqual(
			unaffected,
		)
		const stale = await move(b.id, source, source, 2, 409, b.version)
		expect(stale.body.reason).toBe('VERSION_MISMATCH')
		expect(await list(source)).toEqual(snapshot)
		await move(b.id, source, source, 2, 200, 1)
		await expectOrder(source, [c.id, a.id, b.id])
	})

	it('invalidates task snapshots after a column deletion transfers its tasks', async () => {
		const [source, target, next] = extraBoard.columns
		const moving = await task(source.id, 'Transferred', 0)
		await request(server)
			.delete(`/boards/${extraBoard.id}/columns/${source.id}`)
			.set('Cookie', ownerCookies)
			.send({ targetColumnId: target.id })
			.expect(204)
		const transferred = await prisma.task.findUniqueOrThrow({ where: { id: moving.id } })
		expect(transferred).toMatchObject({ version: 1, boardColumnId: target.id })
		const stale = await move(moving.id, target.id, next.id, 0, 409, moving.version)
		expect(stale.body.reason).toBe('VERSION_MISMATCH')
		expect(await prisma.task.findUniqueOrThrow({ where: { id: moving.id } })).toEqual(
			transferred,
		)
		await move(moving.id, target.id, next.id, 0, 200, transferred.version)
	})

	it.each([undefined, -1, 0.5, '0', 2147483648])(
		'rejects an absent or invalid version %j without changing the task',
		async (expectedVersion) => {
			const [source, target] = extraBoard.columns
			const moving = await task(source.id, 'Keep', 0)
			await request(server)
				.patch(`${path()}/${moving.id}/move`)
				.set('Cookie', memberCookies)
				.send({
					fromColumnId: source.id,
					toColumnId: target.id,
					position: 0,
					expectedVersion,
				})
				.expect(400)
			expect(await prisma.task.findUniqueOrThrow({ where: { id: moving.id } })).toEqual(
				moving,
			)
		},
	)

	it.each([
		{},
		{ position: 0 },
		{ fromColumnId: 'source', position: 0 },
		{ toColumnId: 'target', position: 0 },
		{ fromColumnId: 'source', toColumnId: 'target', position: -1 },
		{ fromColumnId: 'source', toColumnId: 'target', position: 0.5 },
		{ fromColumnId: 'source', toColumnId: 'target', position: '0' },
		{ fromColumnId: 'source', toColumnId: 'target', position: 2147483648 },
		{ fromColumnId: '', toColumnId: 'target', position: 0 },
		{ fromColumnId: 'source', toColumnId: 'target', position: 0, status: 'TODO' },
		{ targetColumnId: 'target', position: 0 },
		{ status: 'TODO', position: 0, extra: true },
	])('rejects a malformed or ambiguous move request %j', async (body) => {
		await request(server)
			.patch(`${path()}/missing/move`)
			.set('Cookie', memberCookies)
			.send(body)
			.expect(400)
	})

	it('keeps positions and every task consistent after repeated moves', async () => {
		const cols = extraBoard.columns.slice(0, 3)
		const tasks = await Promise.all(
			Array.from({ length: 7 }, (_, index) =>
				task(cols[0].id, `Task ${index}`, index * 2 + 1),
			),
		)
		const expected = [tasks.map((item) => item.id), [] as string[], [] as string[]]
		for (let index = 0; index < 40; index++) {
			const id = tasks[index % tasks.length].id
			const from = expected.findIndex((items) => items.includes(id))
			const to = (index * 7 + 1) % cols.length
			expected[from].splice(expected[from].indexOf(id), 1)
			const position = (index * 3) % (expected[to].length + 1)
			expected[to].splice(position, 0, id)
			await move(id, cols[from].id, cols[to].id, position)
		}
		for (const [index, column] of cols.entries())
			await expectOrder(column.id, expected[index])
		expect(await prisma.task.count({ where: { projectId } })).toBe(tasks.length)
	})

	it('normalizes positions across bulk update batches', async () => {
		const [source, target] = extraBoard.columns
		const moving = await task(source.id, 'Moving', 3)
		await prisma.task.createMany({
			data: Array.from({ length: 501 }, (_, index) => ({
				projectId,
				boardColumnId: target.id,
				title: `Bulk ${index}`,
				position: 1000 + index * 2,
				createdById: ownerId,
			})),
		})
		await move(moving.id, source.id, target.id, 0)
		const result = await list(target.id)
		expect(result).toHaveLength(502)
		expect(result.map((item) => item.position)).toEqual(
			Array.from({ length: 502 }, (_, index) => index),
		)
		expect(result.map((item) => item.title)).toEqual([
			'Moving',
			...Array.from({ length: 501 }, (_, index) => `Bulk ${index}`),
		])
	})

	it('rolls back the moving task and every reordered neighbour if a later database write fails', async () => {
		const [source, target] = extraBoard.columns
		const moving = await task(source.id, 'Moving', 7)
		const neighbour = await task(target.id, 'Reject reorder', 8)
		await prisma.$executeRawUnsafe(`CREATE FUNCTION test_board_move_reject_position() RETURNS trigger LANGUAGE plpgsql AS $$
			BEGIN IF NEW."title" = 'Reject reorder' AND NEW."position" IS DISTINCT FROM OLD."position" THEN
				RAISE EXCEPTION 'Injected serialization failure' USING ERRCODE = '40001'; END IF; RETURN NEW; END $$`)
		try {
			await prisma.$executeRawUnsafe(
				'CREATE TRIGGER test_board_move_reject_position BEFORE UPDATE ON "Task" FOR EACH ROW EXECUTE FUNCTION test_board_move_reject_position()',
			)
			await moveWithMetadata(moving, target.id, {
				priority: 'LOW',
				assigneeId: null,
			}).expect(409)
			expect(await prisma.task.findUniqueOrThrow({ where: { id: moving.id } })).toEqual(
				moving,
			)
			expect(
				await prisma.task.findUniqueOrThrow({ where: { id: neighbour.id } }),
			).toEqual(neighbour)
		} finally {
			await prisma.$executeRawUnsafe(
				'DROP TRIGGER IF EXISTS test_board_move_reject_position ON "Task"',
			)
			await prisma.$executeRawUnsafe('DROP FUNCTION test_board_move_reject_position()')
		}
	})

	it('serializes concurrent reorders and exposes complete board snapshots during moves', async () => {
		const [source, target] = extraBoard.columns
		const tasks = await Promise.all(
			Array.from({ length: 7 }, (_, index) => task(source.id, `Task ${index}`, index)),
		)
		const movement = (async () => {
			for (let index = 0; index < 12; index++) {
				const from = index % 2 === 0 ? source.id : target.id
				const to = index % 2 === 0 ? target.id : source.id
				await move(tasks[0].id, from, to)
			}
		})()
		const reads = Promise.all(
			Array.from({ length: 15 }, async () => {
				const result = await view(extraBoard.id)
				expect(
					result.columns.flatMap((column) => column.tasks.map((item) => item.id)).sort(),
				).toEqual(tasks.map((item) => item.id).sort())
			}),
		)
		await Promise.all([movement, reads])
		const snapshot = await list(source.id)
		const attempts = await Promise.all(
			snapshot.map((item) =>
				request(server)
					.patch(`${path()}/${item.id}/move`)
					.set('Cookie', memberCookies)
					.send({
						fromColumnId: source.id,
						toColumnId: source.id,
						position: 2,
						expectedVersion: item.version,
					}),
			),
		)
		expect(attempts.some((response) => response.status === 200)).toBe(true)
		expect(attempts.every((response) => [200, 409].includes(response.status))).toBe(true)
		const result = await list(source.id)
		expect(result.map((item) => item.id).sort()).toEqual(
			tasks.map((item) => item.id).sort(),
		)
		expect(result.map((item) => item.position)).toEqual([0, 1, 2, 3, 4, 5, 6])
	})

	it('accepts only one of two moves that declare the same old source', async () => {
		const [source, target, other] = extraBoard.columns
		const moving = await task(source.id, 'Moving', 1)
		const responses = await Promise.all(
			[target, other].map((column) =>
				request(server)
					.patch(`${path()}/${moving.id}/move`)
					.set('Cookie', memberCookies)
					.send({
						fromColumnId: source.id,
						toColumnId: column.id,
						position: 0,
						expectedVersion: moving.version,
					}),
			),
		)
		expect(responses.map((response) => response.status).sort()).toEqual([200, 409])
		expect(responses.find((response) => response.status === 409)?.body).toMatchObject({
			code: 'TASK_MOVE_CONFLICT',
			reason: 'SOURCE_CHANGED',
			taskId: moving.id,
		})
		expect(await prisma.task.count({ where: { projectId } })).toBe(1)
		expect(await list(source.id)).toHaveLength(0)
	})

	it('supports opposite transfers between two boards without losing tasks', async () => {
		const a = await task(mainBoard.columns[0].id, 'A', 1)
		const b = await task(extraBoard.columns[0].id, 'B', 1)
		await Promise.all([
			move(a.id, mainBoard.columns[0].id, extraBoard.columns[0].id),
			move(b.id, extraBoard.columns[0].id, mainBoard.columns[0].id),
		])
		await expectOrder(mainBoard.columns[0].id, [b.id])
		await expectOrder(extraBoard.columns[0].id, [a.id])
	})

	function deferred<T>() {
		let resolve!: (value: T) => void
		const promise = new Promise<T>((done) => {
			resolve = done
		})
		return { promise, resolve }
	}

	async function waitForBlockedTask(blockerPid: number) {
		const deadline = Date.now() + 4000
		while (Date.now() < deadline) {
			const [row] = await prisma.$queryRaw<{ blocked: boolean }[]>(Prisma.sql`
				SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE ${blockerPid}::integer = ANY(pg_blocking_pids(pid)) AND query LIKE '%FROM "Task"%FOR UPDATE%') AS blocked
			`)
			if (row.blocked) return
			await setTimeout(10)
		}
		throw new Error('Move did not wait for a task lock')
	}

	it('compares the current version after a concurrent edit releases its task lock', async () => {
		const [source, target] = extraBoard.columns
		const moving = await task(source.id, 'Before concurrent edit', 1)
		const ready = deferred<number>()
		const release = deferred<void>()
		const writer = prisma.$transaction(
			async (tx) => {
				await tx.task.update({
					where: { id: moving.id },
					data: { title: 'Concurrent edit', version: { increment: 1 } },
				})
				const [row] = await tx.$queryRaw<
					{ pid: number }[]
				>`SELECT pg_backend_pid() AS pid`
				ready.resolve(row.pid)
				await release.promise
			},
			{ timeout: 10_000 },
		)
		const pid = await ready.promise
		const pending = request(server)
			.patch(`${path()}/${moving.id}/move`)
			.set('Cookie', memberCookies)
			.send({
				fromColumnId: source.id,
				toColumnId: target.id,
				position: 0,
				expectedVersion: moving.version,
			})
			.then((response) => response)
		try {
			await waitForBlockedTask(pid)
		} finally {
			release.resolve()
		}
		await writer
		expect((await pending).body).toMatchObject({
			statusCode: 409,
			code: 'TASK_MOVE_CONFLICT',
			reason: 'VERSION_MISMATCH',
			taskId: moving.id,
		})
		expect(
			await prisma.task.findUniqueOrThrow({ where: { id: moving.id } }),
		).toMatchObject({
			title: 'Concurrent edit',
			boardColumnId: source.id,
			position: 1,
			version: 1,
		})
		expect(await list(target.id)).toHaveLength(0)
	})

	it('does not overwrite a concurrent column change while waiting for its lock', async () => {
		const [source, target, escaped] = extraBoard.columns
		const moving = await task(source.id, 'Moving', 1)
		const ready = deferred<number>()
		const release = deferred<void>()
		const writer = prisma.$transaction(
			async (tx) => {
				await tx.task.update({
					where: { id: moving.id },
					data: { boardColumnId: escaped.id, position: 9 },
				})
				const [row] = await tx.$queryRaw<
					{ pid: number }[]
				>`SELECT pg_backend_pid() AS pid`
				ready.resolve(row.pid)
				await release.promise
			},
			{ timeout: 10_000 },
		)
		const pid = await ready.promise
		const pending = request(server)
			.patch(`${path()}/${moving.id}/move`)
			.set('Cookie', memberCookies)
			.send({
				fromColumnId: source.id,
				toColumnId: target.id,
				position: 0,
				expectedVersion: moving.version,
			})
			.then((response) => response)
		try {
			await waitForBlockedTask(pid)
		} finally {
			release.resolve()
		}
		await writer
		expect((await pending).status).toBe(409)
		expect(
			await prisma.task.findUniqueOrThrow({ where: { id: moving.id } }),
		).toMatchObject({ boardColumnId: escaped.id, position: 9 })
	})

	it('serializes a move with source-column deletion without losing data', async () => {
		const [source, target] = extraBoard.columns
		const moving = await task(source.id, 'Moving', 1)
		const [moved, deleted] = await Promise.all([
			request(server)
				.patch(`${path()}/${moving.id}/move`)
				.set('Cookie', memberCookies)
				.send({
					fromColumnId: source.id,
					toColumnId: target.id,
					position: 0,
					expectedVersion: moving.version,
				}),
			request(server)
				.delete(`/boards/${extraBoard.id}/columns/${source.id}`)
				.set('Cookie', ownerCookies)
				.send({ targetColumnId: target.id }),
		])
		expect([200, 404, 409]).toContain(moved.status)
		expect(deleted.status).toBe(204)
		expect(
			await prisma.task.findUniqueOrThrow({ where: { id: moving.id } }),
		).toMatchObject({ boardColumnId: target.id, position: 0 })
		expect(await prisma.task.count({ where: { projectId } })).toBe(1)
	})

	it('serializes a cross-board move with target-board deletion', async () => {
		const moving = await task(mainBoard.columns[0].id, 'Moving', 1)
		const [moved, deleted] = await Promise.all([
			request(server)
				.patch(`${path()}/${moving.id}/move`)
				.set('Cookie', memberCookies)
				.send({
					fromColumnId: mainBoard.columns[0].id,
					toColumnId: extraBoard.columns[0].id,
					position: 0,
					expectedVersion: moving.version,
				}),
			request(server)
				.delete(`/teams/${teamId}/projects/${projectId}/boards/${extraBoard.id}`)
				.set('Cookie', ownerCookies),
		])
		expect([
			[200, 409],
			[404, 204],
		]).toContainEqual([moved.status, deleted.status])
		expect(await prisma.task.count({ where: { projectId } })).toBe(1)
		const stored = await prisma.task.findUniqueOrThrow({ where: { id: moving.id } })
		expect(stored.boardColumnId).toBe(
			moved.status === 200 ? extraBoard.columns[0].id : mainBoard.columns[0].id,
		)
	})

	it('publishes required board selection and one column-based move contract in Swagger', () => {
		const document = cleanupOpenApiDoc(
			SwaggerModule.createDocument(
				app,
				new DocumentBuilder().setTitle('Board tasks').setVersion('1').build(),
			),
		)
		const board = document.paths['/teams/{teamId}/projects/{projectId}/tasks/board'].get!
		expect(board.parameters).toContainEqual(
			expect.objectContaining({ name: 'boardId', in: 'query', required: true }),
		)
		expect(board.responses['200']).toMatchObject({
			content: {
				'application/json': {
					schema: { $ref: expect.stringContaining('BoardViewResponseDto') },
				},
			},
		})
		expect(
			document.paths['/teams/{teamId}/projects/{projectId}/tasks/{taskId}/move'].patch
				?.responses['200'],
		).toMatchObject({
			content: {
				'application/json': {
					schema: { $ref: expect.stringContaining('BoardTaskResponseDto') },
				},
			},
		})
		expect(document.components?.schemas?.MoveTaskToColumnDto).toMatchObject({
			required: ['fromColumnId', 'toColumnId', 'position', 'expectedVersion'],
			additionalProperties: false,
			properties: {
				priority: { enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
				assigneeId: expect.any(Object),
			},
		})
		expect(document.components?.schemas?.BoardViewResponseDto).toMatchObject({
			required: ['board', 'columns'],
		})
		expect(document.components?.schemas?.TaskResponseDto).toMatchObject({
			properties: { version: { type: 'number', minimum: 0 } },
		})
		expect(document.components?.schemas?.TaskMoveConflictResponseDto).toMatchObject({
			properties: {
				code: { enum: ['TASK_MOVE_CONFLICT'] },
				reason: { enum: ['SOURCE_CHANGED', 'VERSION_MISMATCH', 'WRITE_CONFLICT'] },
			},
		})
		expect(document.components?.schemas?.MoveTaskDto).toBeUndefined()
		expect(document.components?.schemas?.BoardColumnDto).toBeUndefined()
	})
})
