import type { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { FEATURE_KEYS, type BoardListItem, type UpdateBoard } from '@repo/types'
import type { Server } from 'node:http'
import type { Redis } from 'ioredis'
import { cleanupOpenApiDoc } from 'nestjs-zod'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { PrismaService } from '../../prisma/prisma.service'
import { createTestApp, registerAndLogin, resetE2eState } from '../helpers/e2e.helpers'

describe('Boards (e2e)', () => {
	let app: INestApplication
	let server: Server
	let prisma: PrismaService
	let redis: Redis
	let ownerCookies: string
	let adminCookies: string
	let memberCookies: string
	let outsiderCookies: string
	let teamId: string
	let projectId: string
	let otherTeamId: string
	let otherProjectId: string
	let defaultBoardId: string
	let ownerId: string

	const path = (team = teamId, project = projectId) =>
		`/teams/${team}/projects/${project}/boards`
	const snapshotBoard = (boardId: string) =>
		prisma.board.findUniqueOrThrow({
			where: { id: boardId },
			include: { columns: { orderBy: { id: 'asc' } } },
		})

	beforeAll(async () => {
		const testApp = await createTestApp()
		app = testApp.app
		server = app.getHttpServer() as Server
		prisma = testApp.prisma
		redis = testApp.redisClient
		await resetE2eState(prisma, redis)
		ownerCookies = (await registerAndLogin(app, 'boards-owner@example.com')).cookies
		adminCookies = (await registerAndLogin(app, 'boards-admin@example.com')).cookies
		memberCookies = (await registerAndLogin(app, 'boards-member@example.com')).cookies
		outsiderCookies = (await registerAndLogin(app, 'boards-outsider@example.com')).cookies
		const owner = await prisma.user.findUniqueOrThrow({
			where: { email: 'boards-owner@example.com' },
		})
		const admin = await prisma.user.findUniqueOrThrow({
			where: { email: 'boards-admin@example.com' },
		})
		const member = await prisma.user.findUniqueOrThrow({
			where: { email: 'boards-member@example.com' },
		})
		ownerId = owner.id
		const team = await prisma.team.create({
			data: {
				name: 'Boards team',
				members: {
					create: [
						{ userId: owner.id, role: 'OWNER' },
						{ userId: admin.id, role: 'ADMIN' },
						{ userId: member.id, role: 'MEMBER' },
					],
				},
			},
		})
		teamId = team.id
		const otherTeam = await prisma.team.create({
			data: {
				name: 'Other boards team',
				members: { create: { userId: owner.id, role: 'OWNER' } },
			},
		})
		otherTeamId = otherTeam.id
		const project = await request(server)
			.post(`/teams/${teamId}/projects`)
			.set('Cookie', ownerCookies)
			.send({ name: 'Boards project' })
			.expect(201)
		projectId = project.body.id as string
		const otherProject = await request(server)
			.post(`/teams/${otherTeamId}/projects`)
			.set('Cookie', ownerCookies)
			.send({ name: 'Other project' })
			.expect(201)
		otherProjectId = otherProject.body.id as string
		defaultBoardId = (
			await prisma.board.findFirstOrThrow({ where: { projectId, isDefault: true } })
		).id
	})

	beforeEach(async () => {
		await prisma.featureFlag.update({
			where: { key: FEATURE_KEYS.BOARDS },
			data: { enabled: true },
		})
		await prisma.task.deleteMany({
			where: { projectId: { in: [projectId, otherProjectId] } },
		})
		await prisma.board.deleteMany({
			where: {
				OR: [
					{ projectId, id: { not: defaultBoardId } },
					{ projectId: otherProjectId, isDefault: false },
				],
			},
		})
		await prisma.board.update({
			where: { id: defaultBoardId },
			data: { name: 'Основная доска', archivedAt: null, isDefault: true },
		})
	})

	afterAll(async () => {
		try {
			if (prisma && redis) await resetE2eState(prisma, redis)
		} finally {
			if (app) await app.close()
			if (prisma) await prisma.$disconnect()
		}
	})

	async function createBoard(
		name = 'Поддержка',
		cookies = ownerCookies,
		endpoint = path(),
	) {
		const response = await request(server)
			.post(endpoint)
			.set('Cookie', cookies)
			.send({ name })
			.expect(201)
		return response.body as BoardListItem
	}

	const settings = (board: BoardListItem): UpdateBoard => ({
		name: board.name,
		description: board.description,
		expectedUpdatedAt: board.updatedAt,
		columnSnapshot: board.columns.map(({ id, updatedAt }) => ({ id, updatedAt })),
		columns: board.columns.map(({ id, key, title, color }) => ({
			id,
			key,
			title,
			color,
		})),
		removedColumns: [],
	})

	it('serializes competing settings and rejects the stale writer', async () => {
		const board = await createBoard()
		const first = {
			...settings(board),
			name: 'First settings',
			description: 'First description',
		}
		const second = {
			...settings(board),
			name: 'Second settings',
			description: 'Second description',
		}
		second.columns = second.columns!.slice().reverse()
		const responses = await Promise.all(
			[first, second].map((payload) =>
				request(server)
					.patch(`${path()}/${board.id}`)
					.set('Cookie', ownerCookies)
					.send(payload),
			),
		)
		expect(responses.map((response) => response.status).sort()).toEqual([200, 409])
		const accepted = responses.findIndex((response) => response.status === 200)
		const payload = [first, second][accepted]!
		const saved = await snapshotBoard(board.id)
		expect(saved).toMatchObject({ name: payload.name, description: payload.description })
		expect(
			saved.columns
				.slice()
				.sort((a, b) => a.position - b.position)
				.map((column) => column.id),
		).toEqual(payload.columns!.map((column) => column.id))
	})

	it('creates a board with its description and custom initial column order and colors', async () => {
		const response = await request(server)
			.post(path())
			.set('Cookie', ownerCookies)
			.send({
				name: 'Iteration',
				description: 'Current iteration',
				columns: [
					{ key: 'waiting', title: 'Waiting', color: 'cyan' },
					{ key: 'ready', title: 'Ready', color: 'green' },
				],
			})
			.expect(201)
		expect(response.body).toMatchObject({
			description: 'Current iteration',
			taskCount: 0,
			columns: [
				{ key: 'waiting', position: 0, color: 'cyan', isSystem: false },
				{ key: 'ready', position: 1, color: 'green', isSystem: false },
			],
		})
	})

	it('saves metadata, swapped titles, order, drafts and all transferred tasks together', async () => {
		const board = await createBoard()
		const source = board.columns[0]!
		const task = await prisma.task.create({
			data: {
				title: 'Hidden task',
				projectId,
				boardColumnId: source.id,
				createdById: ownerId,
				version: 3,
			},
		})
		const payload = settings(board)
		const remaining = payload.columns!.slice(1).reverse()
		const title = remaining[0]!.title
		remaining[0]!.title = remaining[1]!.title
		remaining[1]!.title = title
		remaining[0]!.color = 'red'
		payload.columns = [...remaining, { key: 'release', title: 'Release', color: 'cyan' }]
		payload.name = 'Updated board'
		payload.description = 'Updated description'
		payload.removedColumns = [{ id: source.id, targetKey: 'release' }]
		const response = await request(server)
			.patch(`${path()}/${board.id}`)
			.set('Cookie', ownerCookies)
			.send(payload)
			.expect(200)
		expect(response.body).toMatchObject({
			name: payload.name,
			description: payload.description,
			taskCount: 1,
		})
		expect(
			response.body.columns.map(
				(column: { key: string; position: number; title: string; color: string }) => ({
					key: column.key,
					position: column.position,
					title: column.title,
					color: column.color,
				}),
			),
		).toEqual(
			payload.columns.map(({ key, title, color }, position) => ({
				key,
				position,
				title,
				color,
			})),
		)
		const release = response.body.columns.find(
			(column: { key: string }) => column.key === 'release',
		)
		expect(await prisma.task.findUniqueOrThrow({ where: { id: task.id } })).toMatchObject(
			{ boardColumnId: release.id, version: 4, title: 'Hidden task' },
		)
		expect(await prisma.boardColumn.findUnique({ where: { id: source.id } })).toBeNull()
	})

	it('rejects a guarded empty-column removal if a task appears after the snapshot', async () => {
		const board = await createBoard()
		const source = board.columns[0]!
		expect(board.taskCount).toBe(0)
		const original = await snapshotBoard(board.id)
		const payload = settings(board)
		payload.name = 'Must not rename'
		payload.description = 'Must not change'
		payload.columns = payload.columns!.slice(1).reverse()
		payload.columns[0]!.title = 'Must not rename column'
		payload.columns.push({ key: 'draft', title: 'Must not create', color: 'red' })
		payload.removedColumns = [
			{ id: source.id, targetKey: payload.columns[0]!.key, requireEmpty: true },
		]
		const created = await request(server)
			.post(`/teams/${teamId}/projects/${projectId}/tasks`)
			.set('Cookie', ownerCookies)
			.send({ title: 'Added while settings were open', boardColumnId: source.id })
			.expect(201)
		const task = await prisma.task.findUniqueOrThrow({
			where: { id: created.body.id as string },
		})
		expect(await snapshotBoard(board.id)).toEqual(original)
		const response = await request(server)
			.patch(`${path()}/${board.id}`)
			.set('Cookie', ownerCookies)
			.send(payload)
			.expect(409)
		expect(response.body.message).toBe(
			'В колонке появились задачи. Откройте настройки заново и выберите, куда их перенести.',
		)
		expect(await snapshotBoard(board.id)).toEqual(original)
		expect(await prisma.task.findMany({ where: { projectId } })).toEqual([task])
	})

	it('saves a guarded removal when the column is still empty', async () => {
		const board = await createBoard()
		const source = board.columns[0]!
		const payload = settings(board)
		payload.name = 'Saved empty removal'
		payload.columns = payload.columns!.slice(1)
		payload.removedColumns = [
			{ id: source.id, targetKey: payload.columns[0]!.key, requireEmpty: true },
		]
		const response = await request(server)
			.patch(`${path()}/${board.id}`)
			.set('Cookie', ownerCookies)
			.send(payload)
			.expect(200)
		expect(response.body).toMatchObject({ name: payload.name, taskCount: 0 })
		expect((response.body as BoardListItem).columns.map((column) => column.id)).toEqual(
			payload.columns.map((column) => column.id),
		)
		expect(await prisma.boardColumn.findUnique({ where: { id: source.id } })).toBeNull()
	})

	it('rolls back task transfers and every column change if board metadata conflicts', async () => {
		await createBoard('Taken')
		const board = await createBoard()
		const source = board.columns[0]!
		const task = await prisma.task.create({
			data: {
				title: 'Keep task',
				projectId,
				boardColumnId: source.id,
				createdById: ownerId,
				version: 8,
			},
		})
		const original = await snapshotBoard(board.id)
		const payload = settings(board)
		payload.name = 'Taken'
		payload.description = 'Must roll back'
		payload.columns = payload.columns!.slice(1).reverse()
		payload.removedColumns = [{ id: source.id, targetKey: payload.columns[0]!.key }]
		await request(server)
			.patch(`${path()}/${board.id}`)
			.set('Cookie', ownerCookies)
			.send(payload)
			.expect(409)
		expect(await snapshotBoard(board.id)).toEqual(original)
		expect(await prisma.task.findUniqueOrThrow({ where: { id: task.id } })).toEqual(task)
	})

	it('rejects stale column snapshots and foreign transfer targets without partial writes', async () => {
		const board = await createBoard()
		const payload = settings(board)
		await prisma.boardColumn.update({
			where: { id: board.columns[0]!.id },
			data: { title: 'Concurrent title', updatedAt: new Date(Date.now() + 1000) },
		})
		const current = await snapshotBoard(board.id)
		payload.name = 'Stale board'
		payload.columns!.push({ key: 'draft', title: 'Draft', color: 'orange' })
		await request(server)
			.patch(`${path()}/${board.id}`)
			.set('Cookie', ownerCookies)
			.send(payload)
			.expect(409)
		expect(await snapshotBoard(board.id)).toEqual(current)
		const refreshed = (
			await request(server).get(path()).set('Cookie', ownerCookies).expect(200)
		).body.find((item: BoardListItem) => item.id === board.id) as BoardListItem
		const invalid = settings(refreshed)
		invalid.columns = invalid.columns!.slice(1)
		invalid.removedColumns = [{ id: refreshed.columns[0]!.id, targetKey: 'foreign-key' }]
		await request(server)
			.patch(`${path()}/${board.id}`)
			.set('Cookie', ownerCookies)
			.send(invalid)
			.expect(400)
		expect(await snapshotBoard(board.id)).toEqual(current)
	})

	it('preserves system columns and synchronizes status and version on transfer into them', async () => {
		const source = await prisma.boardColumn.create({
			data: {
				boardId: defaultBoardId,
				projectId,
				key: 'custom',
				title: 'Custom',
				position: 10,
			},
		})
		const task = await prisma.task.create({
			data: {
				title: 'Transfer to done',
				projectId,
				boardColumnId: source.id,
				createdById: ownerId,
			},
		})
		const board = (
			await request(server).get(path()).set('Cookie', ownerCookies).expect(200)
		).body.find((item: BoardListItem) => item.id === defaultBoardId) as BoardListItem
		const payload = settings(board)
		const done = board.columns.find((column) => column.key === 'DONE')!
		payload.columns = payload.columns!.filter((column) => column.id !== source.id)
		payload.removedColumns = [{ id: source.id, targetKey: done.key }]
		await request(server)
			.patch(`${path()}/${board.id}`)
			.set('Cookie', ownerCookies)
			.send(payload)
			.expect(200)
		expect(await prisma.task.findUniqueOrThrow({ where: { id: task.id } })).toMatchObject(
			{ boardColumnId: done.id, status: 'DONE', version: task.version + 1 },
		)
		const refreshed = (
			await request(server).get(path()).set('Cookie', ownerCookies).expect(200)
		).body.find((item: BoardListItem) => item.id === defaultBoardId) as BoardListItem
		const invalid = settings(refreshed)
		invalid.columns = invalid.columns!.filter((column) => column.id !== done.id)
		invalid.removedColumns = [{ id: done.id, targetKey: invalid.columns[0]!.key }]
		const original = await snapshotBoard(board.id)
		await request(server)
			.patch(`${path()}/${board.id}`)
			.set('Cookie', ownerCookies)
			.send(invalid)
			.expect(409)
		expect(await snapshotBoard(board.id)).toEqual(original)
	})

	it('lists the project default board with ordered columns and serialized dates for a member', async () => {
		const response = await request(server)
			.get(path())
			.set('Cookie', memberCookies)
			.expect(200)
		const boards = response.body as BoardListItem[]
		expect(boards).toHaveLength(1)
		expect(boards[0]).toMatchObject({
			id: defaultBoardId,
			projectId,
			isDefault: true,
			name: 'Основная доска',
			taskCount: 0,
			createdAt: expect.any(String),
			updatedAt: expect.any(String),
		})
		expect(boards[0].columns.map((column) => column.key)).toEqual([
			'TODO',
			'IN_PROGRESS',
			'IN_REVIEW',
			'DONE',
		])
		expect(boards[0].columns.map((column) => column.position)).toEqual([0, 1, 2, 3])
		expect(
			boards[0].columns.every(
				(column) =>
					column.isSystem &&
					column.projectId === projectId &&
					column.boardId === defaultBoardId,
			),
		).toBe(true)
	})

	it('считает задачи отдельно для каждой доски и обновляет счётчик после переноса и удаления', async () => {
		const first = await createBoard('Первая')
		const second = await createBoard('Вторая')
		const task = await prisma.task.create({
			data: {
				title: 'Задача',
				projectId,
				boardColumnId: first.columns[0].id,
				createdById: ownerId,
			},
		})
		const counts = async () => {
			const response = await request(server)
				.get(path())
				.set('Cookie', memberCookies)
				.expect(200)
			const boards = response.body as BoardListItem[]
			expect(
				boards.every((board) =>
					board.columns.every((column) => !('_count' in column) && !('tasks' in column)),
				),
			).toBe(true)
			return Object.fromEntries(boards.map((board) => [board.id, board.taskCount]))
		}
		expect(await counts()).toEqual({ [defaultBoardId]: 0, [first.id]: 1, [second.id]: 0 })
		await request(server)
			.patch(`/teams/${teamId}/projects/${projectId}/tasks/${task.id}/move`)
			.set('Cookie', ownerCookies)
			.send({
				fromColumnId: first.columns[0].id,
				toColumnId: second.columns[0].id,
				position: 0,
				expectedVersion: task.version,
			})
			.expect(200)
		expect(await counts()).toEqual({ [defaultBoardId]: 0, [first.id]: 0, [second.id]: 1 })
		const renamed = await request(server)
			.patch(`${path()}/${second.id}`)
			.set('Cookie', ownerCookies)
			.send({ name: 'Переименована' })
			.expect(200)
		expect(renamed.body).toMatchObject({ taskCount: 1 })
		await request(server)
			.delete(`/teams/${teamId}/projects/${projectId}/tasks/${task.id}`)
			.set('Cookie', ownerCookies)
			.expect(204)
		expect(await counts()).toEqual({ [defaultBoardId]: 0, [first.id]: 0, [second.id]: 0 })
	})

	it('creates a regular board and initializes editable columns without changing the default', async () => {
		const board = await createBoard('  Поддержка  ')
		expect(board).toMatchObject({
			name: 'Поддержка',
			projectId,
			isDefault: false,
			taskCount: 0,
		})
		expect(board.columns).toHaveLength(4)
		expect(
			board.columns.every((column) => !column.isSystem && column.boardId === board.id),
		).toBe(true)
		const response = await request(server)
			.get(path())
			.set('Cookie', ownerCookies)
			.expect(200)
		expect((response.body as BoardListItem[]).map((item) => item.id)).toEqual([
			defaultBoardId,
			board.id,
		])
	})

	it.each(['owner', 'admin'])(
		'allows an %s to manage a regular empty board',
		async (role) => {
			const cookies = role === 'owner' ? ownerCookies : adminCookies
			const board = await createBoard('Managed board', cookies)
			const listed = await request(server).get(path()).set('Cookie', cookies).expect(200)
			expect((listed.body as BoardListItem[]).map((item) => item.id)).toContain(board.id)
			const updated = await request(server)
				.patch(`${path()}/${board.id}`)
				.set('Cookie', cookies)
				.send({ name: ' Renamed ' })
				.expect(200)
			expect(updated.body).toMatchObject({
				id: board.id,
				name: 'Renamed',
				isDefault: false,
			})
			expect((updated.body as BoardListItem).columns.map((column) => column.id)).toEqual(
				board.columns.map((column) => column.id),
			)
			await request(server)
				.delete(`${path()}/${board.id}`)
				.set('Cookie', cookies)
				.expect(204)
			expect(await prisma.board.findUnique({ where: { id: board.id } })).toBeNull()
			expect(await prisma.boardColumn.count({ where: { boardId: board.id } })).toBe(0)
			expect(await prisma.board.count({ where: { projectId, isDefault: true } })).toBe(1)
		},
	)

	it.each(['member', 'outsider'])('rejects every mutation by a %s', async (role) => {
		const board = await createBoard()
		const cookies = role === 'member' ? memberCookies : outsiderCookies
		await request(server)
			.post(path())
			.set('Cookie', cookies)
			.send({ name: 'Forbidden' })
			.expect(403)
		await request(server)
			.patch(`${path()}/${board.id}`)
			.set('Cookie', cookies)
			.send({ name: 'Forbidden' })
			.expect(403)
		await request(server)
			.delete(`${path()}/${board.id}`)
			.set('Cookie', cookies)
			.expect(403)
		expect(
			await prisma.board.findUniqueOrThrow({ where: { id: board.id } }),
		).toMatchObject({ name: 'Поддержка' })
		expect(await prisma.board.count({ where: { projectId } })).toBe(2)
	})

	it('rejects outsider reads and unauthenticated requests', async () => {
		const board = await createBoard()
		const original = await snapshotBoard(board.id)
		await request(server).get(path()).set('Cookie', outsiderCookies).expect(403)
		await request(server).get(path()).expect(401)
		await request(server).post(path()).send({ name: 'Unauthenticated' }).expect(401)
		await request(server)
			.patch(`${path()}/${board.id}`)
			.send({ name: 'Unauthenticated' })
			.expect(401)
		await request(server).delete(`${path()}/${board.id}`).expect(401)
		expect(await snapshotBoard(board.id)).toEqual(original)
		expect(await prisma.board.count({ where: { projectId } })).toBe(2)
	})

	it('applies an admin demotion immediately to an existing authenticated session', async () => {
		const board = await createBoard()
		const original = await snapshotBoard(board.id)
		const admin = await prisma.user.findUniqueOrThrow({
			where: { email: 'boards-admin@example.com' },
		})
		const membership = { teamId_userId: { teamId, userId: admin.id } }
		await prisma.teamMember.update({ where: membership, data: { role: 'MEMBER' } })
		try {
			await request(server).get(path()).set('Cookie', adminCookies).expect(200)
			await request(server)
				.post(path())
				.set('Cookie', adminCookies)
				.send({ name: 'Denied after demotion' })
				.expect(403)
			await request(server)
				.patch(`${path()}/${board.id}`)
				.set('Cookie', adminCookies)
				.send({ name: 'Denied after demotion' })
				.expect(403)
			await request(server)
				.delete(`${path()}/${board.id}`)
				.set('Cookie', adminCookies)
				.expect(403)
			expect(await snapshotBoard(board.id)).toEqual(original)
			expect(await prisma.board.count({ where: { projectId } })).toBe(2)
		} finally {
			await prisma.teamMember.update({ where: membership, data: { role: 'ADMIN' } })
		}
	})

	it('validates team/project scope even when the user belongs to both teams', async () => {
		const foreign = await createBoard(
			'Foreign',
			ownerCookies,
			path(otherTeamId, otherProjectId),
		)
		const original = await snapshotBoard(foreign.id)
		await request(server)
			.get(path(teamId, otherProjectId))
			.set('Cookie', ownerCookies)
			.expect(404)
		await request(server)
			.post(path(teamId, otherProjectId))
			.set('Cookie', ownerCookies)
			.send({ name: 'Foreign' })
			.expect(404)
		await request(server)
			.get(path(teamId, 'missing-project'))
			.set('Cookie', ownerCookies)
			.expect(404)
		await request(server)
			.patch(`${path(teamId, otherProjectId)}/${foreign.id}`)
			.set('Cookie', ownerCookies)
			.send({ name: 'Wrong team' })
			.expect(404)
		await request(server)
			.delete(`${path(teamId, otherProjectId)}/${foreign.id}`)
			.set('Cookie', ownerCookies)
			.expect(404)
		expect(await snapshotBoard(foreign.id)).toEqual(original)
		expect(await prisma.board.count({ where: { projectId } })).toBe(1)
		expect(await prisma.board.count({ where: { projectId: otherProjectId } })).toBe(2)
	})

	it('cannot rename or delete a board through another project route', async () => {
		const foreign = await createBoard(
			'Foreign',
			ownerCookies,
			path(otherTeamId, otherProjectId),
		)
		await request(server)
			.patch(`${path()}/${foreign.id}`)
			.set('Cookie', ownerCookies)
			.send({ name: 'Stolen' })
			.expect(404)
		await request(server)
			.delete(`${path()}/${foreign.id}`)
			.set('Cookie', ownerCookies)
			.expect(404)
		expect(
			await prisma.board.findUniqueOrThrow({ where: { id: foreign.id } }),
		).toMatchObject({ name: 'Foreign', projectId: otherProjectId })
	})

	it('returns 404 for missing boards on mutations', async () => {
		await request(server)
			.patch(`${path()}/missing-board`)
			.set('Cookie', ownerCookies)
			.send({ name: 'Missing' })
			.expect(404)
		await request(server)
			.delete(`${path()}/missing-board`)
			.set('Cookie', ownerCookies)
			.expect(404)
	})

	it('enforces unique normalized names per project and preserves data on conflicts', async () => {
		const board = await createBoard('Support')
		await request(server)
			.post(path())
			.set('Cookie', ownerCookies)
			.send({ name: '  Support  ' })
			.expect(409)
		await createBoard('Support', ownerCookies, path(otherTeamId, otherProjectId))
		await request(server)
			.patch(`${path()}/${board.id}`)
			.set('Cookie', ownerCookies)
			.send({ name: 'Основная доска' })
			.expect(409)
		expect(
			await prisma.board.findUniqueOrThrow({ where: { id: board.id } }),
		).toMatchObject({ name: 'Support' })
		expect(await prisma.board.count({ where: { projectId } })).toBe(2)
	})

	it.each(['', '  ', 'x'.repeat(101), 123, null])(
		'rejects invalid board names: %j',
		async (name) => {
			await request(server)
				.post(path())
				.set('Cookie', ownerCookies)
				.send({ name })
				.expect(400)
			await request(server)
				.patch(`${path()}/${defaultBoardId}`)
				.set('Cookie', ownerCookies)
				.send({ name })
				.expect(400)
			expect(await prisma.board.count({ where: { projectId } })).toBe(1)
		},
	)

	it('rejects empty updates and unsupported fields without changing ownership or the default', async () => {
		await request(server)
			.patch(`${path()}/${defaultBoardId}`)
			.set('Cookie', ownerCookies)
			.send({})
			.expect(400)
		await request(server)
			.post(path())
			.set('Cookie', ownerCookies)
			.send({ name: 'Fake default', isDefault: true })
			.expect(400)
		await request(server)
			.patch(`${path()}/${defaultBoardId}`)
			.set('Cookie', ownerCookies)
			.send({ name: 'Move', projectId: otherProjectId })
			.expect(400)
		const board = await createBoard()
		await request(server)
			.delete(`${path()}/${board.id}`)
			.set('Cookie', ownerCookies)
			.send({ targetBoardId: defaultBoardId })
			.expect(400)
		expect(
			await prisma.board.findUniqueOrThrow({ where: { id: defaultBoardId } }),
		).toMatchObject({ name: 'Основная доска', projectId, isDefault: true })
	})

	it('protects the default board even when it has no tasks', async () => {
		await request(server)
			.delete(`${path()}/${defaultBoardId}`)
			.set('Cookie', ownerCookies)
			.expect(409)
		expect(await prisma.boardColumn.count({ where: { boardId: defaultBoardId } })).toBe(4)
	})

	it('does not delete a board with tasks or any of its columns', async () => {
		const board = await createBoard()
		const task = await prisma.task.create({
			data: {
				title: 'Keep this task',
				projectId,
				boardColumnId: board.columns[0].id,
				createdById: ownerId,
			},
		})
		await request(server)
			.delete(`${path()}/${board.id}`)
			.set('Cookie', ownerCookies)
			.expect(409)
		expect(await prisma.board.findUnique({ where: { id: board.id } })).not.toBeNull()
		expect(await prisma.boardColumn.count({ where: { boardId: board.id } })).toBe(4)
		expect(await prisma.task.findUniqueOrThrow({ where: { id: task.id } })).toMatchObject(
			{ boardColumnId: board.columns[0].id, title: 'Keep this task' },
		)
	})

	it('blocks every board route when the feature is disabled', async () => {
		const board = await createBoard()
		await prisma.featureFlag.update({
			where: { key: FEATURE_KEYS.BOARDS },
			data: { enabled: false },
		})
		const denied = await request(server)
			.get(path())
			.set('Cookie', ownerCookies)
			.expect(403)
		expect(denied.body).toMatchObject({
			code: 'FEATURE_DISABLED',
			key: FEATURE_KEYS.BOARDS,
		})
		await request(server)
			.post(path())
			.set('Cookie', ownerCookies)
			.send({ name: 'Disabled' })
			.expect(403)
		await request(server)
			.patch(`${path()}/${board.id}`)
			.set('Cookie', ownerCookies)
			.send({ name: 'Disabled' })
			.expect(403)
		await request(server)
			.delete(`${path()}/${board.id}`)
			.set('Cookie', ownerCookies)
			.expect(403)
	})

	it.each([false, true])(
		'archives a board and preserves its data (with tasks: %s)',
		async (withTasks) => {
			const board = await createBoard('Архивируемая доска')
			const column = board.columns[0]!
			const task = withTasks
				? await prisma.task.create({
						data: {
							title: 'Archived search target',
							projectId,
							boardColumnId: column.id,
							createdById: ownerId,
						},
					})
				: null
			await request(server)
				.post(`${path()}/${board.id}/archive`)
				.set('Cookie', ownerCookies)
				.send({ expectedUpdatedAt: board.updatedAt })
				.expect(204)
			const stored = await snapshotBoard(board.id)
			expect(stored.archivedAt).toBeInstanceOf(Date)
			expect(stored.columns.map(({ id }) => id).sort()).toEqual(
				board.columns.map(({ id }) => id).sort(),
			)
			const active = await request(server)
				.get(path())
				.set('Cookie', ownerCookies)
				.expect(200)
			expect(active.body.map((item: BoardListItem) => item.id)).not.toContain(board.id)
			await request(server)
				.get(`/teams/${teamId}/projects/${projectId}/tasks/board`)
				.query({ boardId: board.id })
				.set('Cookie', ownerCookies)
				.expect(404)
			await request(server)
				.post(`/teams/${teamId}/projects/${projectId}/tasks`)
				.set('Cookie', ownerCookies)
				.send({ title: 'Rejected', boardColumnId: column.id })
				.expect(404)
			await request(server)
				.patch(`${path()}/${board.id}`)
				.set('Cookie', ownerCookies)
				.send({ name: 'Rejected' })
				.expect(404)
			await request(server)
				.post(`/boards/${board.id}/columns`)
				.set('Cookie', ownerCookies)
				.send({ key: 'rejected', title: 'Rejected' })
				.expect(404)
			if (task) {
				const list = await request(server)
					.get(`/teams/${teamId}/projects/${projectId}/tasks`)
					.query({ search: 'Archived search target' })
					.set('Cookie', ownerCookies)
					.expect(200)
				expect(list.body.data).toEqual([])
				expect(list.body.meta.total).toBe(0)
				for (const method of ['get', 'patch', 'delete'] as const) {
					const call = request(server)
						[method](`/teams/${teamId}/projects/${projectId}/tasks/${task.id}`)
						.set('Cookie', ownerCookies)
					await (method === 'patch' ? call.send({ title: 'Rejected' }) : call).expect(404)
				}
				expect(await prisma.task.findUniqueOrThrow({ where: { id: task.id } })).toEqual(
					task,
				)
			}
		},
	)

	it('reassigns the primary board and allows a new primary after archiving all boards', async () => {
		const next = await createBoard('Следующая доска')
		const primary = await prisma.board.findUniqueOrThrow({
			where: { id: defaultBoardId },
		})
		await request(server)
			.post(`${path()}/${defaultBoardId}/archive`)
			.set('Cookie', ownerCookies)
			.send({ expectedUpdatedAt: primary.updatedAt.toISOString() })
			.expect(204)
		expect(
			(await prisma.board.findUniqueOrThrow({ where: { id: next.id } })).isDefault,
		).toBe(true)
		const createdTask = await request(server)
			.post(`/teams/${teamId}/projects/${projectId}/tasks`)
			.set('Cookie', ownerCookies)
			.send({ title: 'Задача без явной колонки' })
			.expect(201)
		expect(createdTask.body.boardColumnId).toBe(next.columns[0]!.id)
		const promoted = await prisma.board.findUniqueOrThrow({ where: { id: next.id } })
		await request(server)
			.post(`${path()}/${next.id}/archive`)
			.set('Cookie', ownerCookies)
			.send({ expectedUpdatedAt: promoted.updatedAt.toISOString() })
			.expect(204)
		const empty = await request(server)
			.get(path())
			.set('Cookie', ownerCookies)
			.expect(200)
		expect(empty.body).toEqual([])
		const fresh = await createBoard('Новая основная доска')
		expect(fresh.isDefault).toBe(true)
	})

	it('checks archive permissions, project scope and stale confirmations', async () => {
		const board = await createBoard()
		const body = { expectedUpdatedAt: board.updatedAt }
		await request(server)
			.post(`${path()}/${board.id}/archive`)
			.set('Cookie', memberCookies)
			.send(body)
			.expect(403)
		await request(server)
			.post(`${path()}/${board.id}/archive`)
			.set('Cookie', outsiderCookies)
			.send(body)
			.expect(403)
		await request(server)
			.post(`${path(otherTeamId, otherProjectId)}/${board.id}/archive`)
			.set('Cookie', ownerCookies)
			.send(body)
			.expect(404)
		await request(server)
			.post(`${path()}/${board.id}/archive`)
			.set('Cookie', ownerCookies)
			.send({ expectedUpdatedAt: '2000-01-01T00:00:00.000Z' })
			.expect(409)
		await request(server)
			.post(`${path()}/${board.id}/archive`)
			.set('Cookie', ownerCookies)
			.send({ ...body, name: 'Unsaved' })
			.expect(400)
		expect((await snapshotBoard(board.id)).archivedAt).toBeNull()
		await request(server)
			.post(`${path()}/${board.id}/archive`)
			.set('Cookie', adminCookies)
			.send(body)
			.expect(204)
	})

	it('serializes archive against task creation without losing tasks', async () => {
		const board = await createBoard()
		const [archived, created] = await Promise.all([
			request(server)
				.post(`${path()}/${board.id}/archive`)
				.set('Cookie', ownerCookies)
				.send({ expectedUpdatedAt: board.updatedAt }),
			request(server)
				.post(`/teams/${teamId}/projects/${projectId}/tasks`)
				.set('Cookie', ownerCookies)
				.send({ title: 'Concurrent archive task', boardColumnId: board.columns[0]!.id }),
		])
		expect(archived.status).toBe(204)
		expect([201, 404]).toContain(created.status)
		const tasks = await prisma.task.findMany({
			where: { boardColumn: { boardId: board.id } },
		})
		expect(tasks).toHaveLength(created.status === 201 ? 1 : 0)
		const active = await request(server)
			.get(`/teams/${teamId}/projects/${projectId}/tasks`)
			.set('Cookie', ownerCookies)
			.expect(200)
		expect(active.body.meta.total).toBe(0)
	})

	it('allows a task FK insert while archive waits for its board lock', async () => {
		const board = await createBoard()
		let release!: () => void
		let locked!: () => void
		const ready = new Promise<void>((resolve) => {
			locked = resolve
		})
		const gate = new Promise<void>((resolve) => {
			release = resolve
		})
		const creating = prisma.$transaction(
			async (tx) => {
				await tx.$queryRaw`SELECT "id" FROM "Board" WHERE "id" = ${board.id} FOR UPDATE`
				locked()
				await gate
				return tx.task.create({
					data: {
						title: 'FK during archive',
						projectId,
						boardColumnId: board.columns[0]!.id,
						createdById: ownerId,
					},
				})
			},
			{ timeout: 15_000 },
		)
		await ready
		const archiving = request(server)
			.post(`${path()}/${board.id}/archive`)
			.set('Cookie', ownerCookies)
			.send({ expectedUpdatedAt: board.updatedAt })
			.then((response) => response)
		try {
			let projectLocked = false
			for (let attempt = 0; attempt < 100; attempt++) {
				const available = await prisma.$queryRaw<
					{ id: string }[]
				>`SELECT "id" FROM "Project" WHERE "id" = ${projectId} FOR NO KEY UPDATE SKIP LOCKED`
				if (available.length === 0) {
					projectLocked = true
					break
				}
				await new Promise((resolve) => setTimeout(resolve, 20))
			}
			expect(projectLocked).toBe(true)
		} finally {
			release()
		}
		const [task, response] = await Promise.all([creating, archiving])
		expect(response.status).toBe(204)
		expect(await prisma.task.findUnique({ where: { id: task.id } })).not.toBeNull()
		expect((await snapshotBoard(board.id)).archivedAt).toBeInstanceOf(Date)
	})

	it('publishes board routes, shared request validation and column responses in Swagger', () => {
		const document = cleanupOpenApiDoc(
			SwaggerModule.createDocument(
				app,
				new DocumentBuilder().setTitle('Boards').setVersion('1').build(),
			),
		)
		const collection = document.paths['/teams/{teamId}/projects/{projectId}/boards']
		const resource =
			document.paths['/teams/{teamId}/projects/{projectId}/boards/{boardId}']
		expect(collection.get).toBeDefined()
		expect(collection.post).toBeDefined()
		expect(resource.patch).toBeDefined()
		expect(resource.delete?.responses['204']).toBeDefined()
		expect(document.components?.schemas?.CreateBoardDto).toMatchObject({
			type: 'object',
			required: ['name'],
			properties: { name: { type: 'string', minLength: 1, maxLength: 100 } },
			additionalProperties: false,
		})
		expect(document.components?.schemas?.UpdateBoardDto).toMatchObject({
			properties: {
				removedColumns: {
					items: {
						required: ['id', 'targetKey'],
						properties: { requireEmpty: { type: 'boolean' } },
					},
				},
			},
		})
		expect(document.components?.schemas?.BoardListItemResponseDto).toMatchObject({
			properties: {
				taskCount: { type: 'number', minimum: 0 },
				columns: {
					type: 'array',
					items: { $ref: expect.stringContaining('BoardColumnResponseDto') },
				},
			},
		})
	})
})
