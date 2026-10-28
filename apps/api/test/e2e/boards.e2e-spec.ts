import type { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { FEATURE_KEYS, type BoardListItem } from '@repo/types'
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
			where: { projectId: { in: [projectId, otherProjectId] }, isDefault: false },
		})
		await prisma.board.update({
			where: { id: defaultBoardId },
			data: { name: 'Основная доска' },
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

	it('creates a regular board and initializes editable columns without changing the default', async () => {
		const board = await createBoard('  Поддержка  ')
		expect(board).toMatchObject({ name: 'Поддержка', projectId, isDefault: false })
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

	it('allows an admin to create, rename and delete a regular empty board', async () => {
		const board = await createBoard('Admin board', adminCookies)
		const updated = await request(server)
			.patch(`${path()}/${board.id}`)
			.set('Cookie', adminCookies)
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
			.set('Cookie', adminCookies)
			.expect(204)
		expect(await prisma.board.findUnique({ where: { id: board.id } })).toBeNull()
		expect(await prisma.boardColumn.count({ where: { boardId: board.id } })).toBe(0)
		expect(await prisma.board.count({ where: { projectId, isDefault: true } })).toBe(1)
	})

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
		await request(server).get(path()).set('Cookie', outsiderCookies).expect(403)
		await request(server).get(path()).expect(401)
		await request(server).post(path()).send({ name: 'Unauthenticated' }).expect(401)
	})

	it('validates team/project scope even when the user belongs to both teams', async () => {
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
		expect(document.components?.schemas?.BoardListItemResponseDto).toMatchObject({
			properties: {
				columns: {
					type: 'array',
					items: { $ref: expect.stringContaining('BoardColumnResponseDto') },
				},
			},
		})
	})
})
