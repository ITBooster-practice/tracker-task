import type { Server } from 'http'
import type { INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { REQUIRED_FEATURE_KEYS } from '@repo/types'
import type { Redis } from 'ioredis'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { PrismaService } from '../../prisma/prisma.service'
import { createTestApp, registerAndLogin, resetE2eState } from '../helpers/e2e.helpers'

describe('Runtime feature flags (e2e)', () => {
	let app: INestApplication, server: Server, prisma: PrismaService, redis: Redis
	let developerCookies: string, userCookies: string, developerId: string
	beforeAll(async () => {
		const testApp = await createTestApp()
		app = testApp.app
		prisma = testApp.prisma
		redis = testApp.redisClient
		server = app.getHttpServer() as Server
	})
	beforeEach(async () => {
		await resetE2eState(prisma, redis)
		await prisma.featureFlagAudit.deleteMany()
		await prisma.featureFlag.deleteMany({
			where: { key: { notIn: [...REQUIRED_FEATURE_KEYS] } },
		})
		await prisma.featureFlag.updateMany({ data: { enabled: true, archivedAt: null } })
		await prisma.featureFlagsRevision.update({
			where: { id: 'global' },
			data: { version: 0 },
		})
		developerCookies = (await registerAndLogin(app, 'developer@example.com')).cookies
		userCookies = (await registerAndLogin(app, 'ordinary@example.com')).cookies
		developerId = (
			await prisma.user.findUniqueOrThrow({ where: { email: 'developer@example.com' } })
		).id
		app.get(ConfigService).set('SYSTEM_DEVELOPER_USER_ID', developerId)
	})
	afterAll(async () => {
		await prisma.featureFlagAudit.deleteMany()
		await prisma.featureFlag.deleteMany({
			where: { key: { notIn: [...REQUIRED_FEATURE_KEYS] } },
		})
		await prisma.featureFlag.updateMany({ data: { enabled: true, archivedAt: null } })
		await redis.flushall()
		await app.close()
		await prisma.$disconnect()
	})
	it('blocks direct API access for disabled projects, tasks, boards and settings', async () => {
		const team = await request(server)
			.post('/teams/new')
			.set('Cookie', developerCookies)
			.send({ name: 'Feature team' })
			.expect(201)
		const teamId = team.body.id as string
		const project = await request(server)
			.post('/teams/' + teamId + '/projects')
			.set('Cookie', developerCookies)
			.send({ name: 'Feature project' })
			.expect(201)
		const projectPath = '/teams/' + teamId + '/projects'
		const taskPath = projectPath + '/' + project.body.id + '/tasks'
		const toggle = async (key: string, enabled: boolean) => {
			const flag = await prisma.featureFlag.findUniqueOrThrow({ where: { key } })
			const revision = await prisma.featureFlagsRevision.findUniqueOrThrow({
				where: { id: 'global' },
			})
			await request(server)
				.patch('/feature-flags/' + flag.id)
				.set('Cookie', developerCookies)
				.send({ enabled, expectedVersion: revision.version })
				.expect(200)
		}
		await toggle('projects', false)
		await request(server).get(projectPath).expect(401)
		for (const method of ['get', 'post', 'patch', 'delete'] as const) {
			const path =
				method === 'get' || method === 'post'
					? projectPath
					: projectPath + '/' + project.body.id
			const blocked = await request(server)
				[method](path)
				.set('Cookie', developerCookies)
				.send({ name: 'Blocked' })
				.expect(403)
			expect(blocked.body.code).toBe('FEATURE_DISABLED')
		}
		await request(server).get(taskPath).set('Cookie', developerCookies).expect(403)
		await toggle('projects', true)
		await request(server).get(projectPath).set('Cookie', userCookies).expect(403)
		await toggle('tasks', false)
		for (const [method, path] of [
			['get', taskPath],
			['post', taskPath],
			['get', taskPath + '/missing'],
			['patch', taskPath + '/missing'],
			['patch', taskPath + '/missing/move'],
			['delete', taskPath + '/missing'],
			['get', taskPath + '/board'],
		] as const) {
			await request(server)
				[method](path)
				.set('Cookie', developerCookies)
				.send({ title: 'Blocked' })
				.expect(403)
		}
		await toggle('tasks', true)
		await toggle('boards', false)
		await request(server)
			.get(taskPath + '/board')
			.set('Cookie', developerCookies)
			.expect(403)
		await request(server).get(taskPath).set('Cookie', developerCookies).expect(200)
		await toggle('team-settings', false)
		for (const [method, path] of [
			['patch', '/teams/' + teamId],
			['delete', '/teams/' + teamId],
			['get', '/teams/' + teamId + '/members'],
			['patch', '/teams/' + teamId + '/members/any/role'],
			['delete', '/teams/' + teamId + '/members/any'],
			['get', '/teams/' + teamId + '/invitations'],
			['post', '/teams/' + teamId + '/invitations'],
			['delete', '/teams/' + teamId + '/invitations/any'],
		] as const) {
			await request(server)
				[method](path)
				.set('Cookie', developerCookies)
				.send({ name: 'Blocked' })
				.expect(403)
		}
		await request(server).get('/teams').set('Cookie', developerCookies).expect(200)
		await request(server).get('/invitations/me').set('Cookie', userCookies).expect(200)
		await request(server).get('/auth/me').set('Cookie', userCookies).expect(200)
	})

	const newFlag = { key: 'boards-redesign-v2', title: 'Обновление досок' }
	async function create() {
		return request(server)
			.post('/feature-flags')
			.set('Cookie', developerCookies)
			.send(newFlag)
			.expect(201)
	}

	it('returns an authenticated, uncached API clock only to the developer', async () => {
		await request(server).get('/feature-flags/server-time').expect(401)
		await request(server)
			.get('/feature-flags/server-time')
			.set('Cookie', userCookies)
			.expect(403)
		const before = Date.now()
		const clock = await request(server)
			.get('/feature-flags/server-time')
			.set('Cookie', developerCookies)
			.expect(200)
		expect(clock.headers['cache-control']).toBe('private, no-store')
		expect(new Date(clock.body.serverTime).getTime()).toBeGreaterThanOrEqual(before)
		expect(new Date(clock.body.serverTime).getTime()).toBeLessThanOrEqual(Date.now())
	})
	it('rejects past deadlines through POST and PATCH without altering revision or audit', async () => {
		const expiresAt = new Date(Date.now() - 60_000).toISOString()
		const rejected = await request(server)
			.post('/feature-flags')
			.set('Cookie', developerCookies)
			.send({ ...newFlag, expiresAt })
			.expect(422)
		expect(rejected.body.message).toContain('времени сервера')
		expect(await prisma.featureFlag.count({ where: { key: newFlag.key } })).toBe(0)
		expect(await prisma.featureFlagAudit.count()).toBe(0)
		expect(
			(await prisma.featureFlagsRevision.findUniqueOrThrow({ where: { id: 'global' } }))
				.version,
		).toBe(0)
		const created = await create()
		await request(server)
			.patch('/feature-flags/' + created.body.flag.id)
			.set('Cookie', developerCookies)
			.send({ expiresAt, expectedVersion: 1 })
			.expect(422)
		expect(
			(
				await prisma.featureFlag.findUniqueOrThrow({
					where: { id: created.body.flag.id },
				})
			).enabled,
		).toBe(false)
		expect(await prisma.featureFlagAudit.count()).toBe(1)
		expect(
			(await prisma.featureFlagsRevision.findUniqueOrThrow({ where: { id: 'global' } }))
				.version,
		).toBe(1)
	})
	it('accepts a future deadline and permits other edits after that saved deadline passes', async () => {
		const expiresAt = new Date(Date.now() + 86_400_000).toISOString()
		const created = await request(server)
			.post('/feature-flags')
			.set('Cookie', developerCookies)
			.send({ ...newFlag, expiresAt })
			.expect(201)
		expect(created.body.flag.expiresAt).toBe(expiresAt)
		const historic = new Date(Date.now() - 86_400_000)
		await prisma.featureFlag.update({
			where: { id: created.body.flag.id },
			data: { expiresAt: historic },
		})
		const edited = await request(server)
			.patch('/feature-flags/' + created.body.flag.id)
			.set('Cookie', developerCookies)
			.send({ title: 'Changed', expiresAt: historic.toISOString(), expectedVersion: 1 })
			.expect(200)
		expect(edited.body.flag.expiresAt).toBe(historic.toISOString())
		await request(server)
			.patch('/feature-flags/' + created.body.flag.id)
			.set('Cookie', developerCookies)
			.send({ expiresAt: null, expectedVersion: 2 })
			.expect(200)
	})

	it('создаёт заготовку и запрещает её включение без изменения версии, аудита и снимка', async () => {
		const created = await create()
		expect(created.body.flag).toMatchObject({
			enabled: false,
			connectedFeature: null,
			required: false,
		})
		const before = await request(server)
			.get('/feature-flags/snapshot')
			.set('Cookie', userCookies)
			.expect(200)
		const rejected = await request(server)
			.patch('/feature-flags/' + created.body.flag.id)
			.set('Cookie', developerCookies)
			.send({ enabled: true, title: 'Не должно сохраниться', expectedVersion: 1 })
			.expect(422)
		expect(rejected.body.message).toContain('не подключён')
		expect(
			await prisma.featureFlag.findUniqueOrThrow({ where: { id: created.body.flag.id } }),
		).toMatchObject({ enabled: false, title: newFlag.title })
		expect(
			(await prisma.featureFlagsRevision.findUniqueOrThrow({ where: { id: 'global' } }))
				.version,
		).toBe(1)
		expect(await prisma.featureFlagAudit.count()).toBe(1)
		await request(server)
			.get('/feature-flags/snapshot')
			.set('Cookie', userCookies)
			.set('If-None-Match', before.headers.etag)
			.expect(304)
		await request(server)
			.patch('/feature-flags/' + created.body.flag.id)
			.set('Cookie', developerCookies)
			.send({ description: 'План подключения', expectedVersion: 1 })
			.expect(200)
	})
	it('возвращает подключение из реестра и разрешает переключать подключённый флаг', async () => {
		const list = await request(server)
			.get('/feature-flags')
			.set('Cookie', developerCookies)
			.expect(200)
		const boards = list.body.flags.find((flag: { key: string }) => flag.key === 'boards')
		expect(boards).toMatchObject({ connectedFeature: 'Доски', required: true })
		for (const [version, enabled] of [
			[0, false],
			[1, true],
		] as const) {
			const updated = await request(server)
				.patch('/feature-flags/' + boards.id)
				.set('Cookie', developerCookies)
				.send({ enabled, expectedVersion: version })
				.expect(200)
			expect(updated.body.flag).toMatchObject({ enabled, connectedFeature: 'Доски' })
		}
	})
	it('разрешает выключить старую включённую заготовку', async () => {
		const created = await create()
		await prisma.featureFlag.update({
			where: { id: created.body.flag.id },
			data: { enabled: true },
		})
		const updated = await request(server)
			.patch('/feature-flags/' + created.body.flag.id)
			.set('Cookie', developerCookies)
			.send({ enabled: false, expectedVersion: 1 })
			.expect(200)
		expect(updated.body.flag.enabled).toBe(false)
	})
	it.each([
		{ ...newFlag, enabled: true },
		{ ...newFlag, enabled: false },
		{ ...newFlag, key: 'projects', enabled: true },
		{ ...newFlag, connectedFeature: 'Доски' },
	])(
		'не позволяет включить флаг при создании или подделать подключение: %j',
		async (body) => {
			await request(server)
				.post('/feature-flags')
				.set('Cookie', developerCookies)
				.send(body)
				.expect(422)
			expect(await prisma.featureFlagAudit.count()).toBe(0)
			expect(
				(await prisma.featureFlagsRevision.findUniqueOrThrow({ where: { id: 'global' } }))
					.version,
			).toBe(0)
		},
	)
	it('requires authentication for snapshot and management', async () => {
		await request(server).get('/feature-flags/snapshot').expect(401)
		await request(server).post('/feature-flags').send(newFlag).expect(401)
	})
	it('allows ordinary users to read snapshot, but denies every management endpoint', async () => {
		const flag = await prisma.featureFlag.findUniqueOrThrow({ where: { key: 'boards' } })
		await request(server)
			.get('/feature-flags/snapshot')
			.set('Cookie', userCookies)
			.expect(200)
		expect(
			(await request(server).get('/feature-flags/access').set('Cookie', userCookies)).body
				.canManage,
		).toBe(false)
		await request(server).get('/feature-flags').set('Cookie', userCookies).expect(403)
		await request(server)
			.post('/feature-flags')
			.set('Cookie', userCookies)
			.send({ ...newFlag, role: 'SYSTEM_DEVELOPER', actorId: developerId })
			.expect(403)
		await request(server)
			.patch('/feature-flags/' + flag.id)
			.set('Cookie', userCookies)
			.send({ enabled: false, expectedVersion: 0 })
			.expect(403)
		await request(server)
			.post('/feature-flags/' + flag.id + '/archive')
			.set('Cookie', userCookies)
			.send({ expectedVersion: 0 })
			.expect(403)
		await request(server)
			.get('/feature-flags/' + flag.id + '/audit')
			.set('Cookie', userCookies)
			.expect(403)
	})
	it('denies everyone when developer ID is missing, including team owners', async () => {
		await request(server)
			.post('/teams/new')
			.set('Cookie', userCookies)
			.send({ name: 'Owner team' })
			.expect(201)
		await request(server).get('/feature-flags').set('Cookie', userCookies).expect(403)
		app.get(ConfigService).set('SYSTEM_DEVELOPER_USER_ID', '')
		await request(server)
			.get('/feature-flags')
			.set('Cookie', developerCookies)
			.expect(403)
	})
	it('returns versioned snapshots and conditional 304 responses', async () => {
		const snapshot = await request(server)
			.get('/feature-flags/snapshot')
			.set('Cookie', userCookies)
			.expect(200)
		expect(snapshot.body.version).toBe(0)
		expect(snapshot.body.flags).toHaveLength(4)
		expect(snapshot.body.flags[0]).not.toHaveProperty('createdById')
		await request(server)
			.get('/feature-flags/snapshot')
			.set('Cookie', userCookies)
			.set('If-None-Match', snapshot.headers.etag)
			.expect(304)
		expect(
			(await request(server).get('/feature-flags/access').set('Cookie', developerCookies))
				.body.canManage,
		).toBe(true)
	})
	it('creates and edits drafts in monotonically versioned transactions', async () => {
		const created = await create()
		const id = created.body.flag.id as string
		expect(created.body.version).toBe(1)
		const updated = await request(server)
			.patch('/feature-flags/' + id)
			.set('Cookie', developerCookies)
			.send({ title: 'Новое название', expectedVersion: 1 })
			.expect(200)
		expect(updated.body.version).toBe(2)
		const audit = await request(server)
			.get('/feature-flags/' + id + '/audit')
			.set('Cookie', developerCookies)
			.expect(200)
		expect(audit.body).toHaveLength(2)
		expect(audit.body[0]).toMatchObject({
			actorId: developerId,
			action: 'UPDATE',
			version: 2,
			before: { enabled: false },
			after: { enabled: false, title: 'Новое название' },
		})
	})
	it('rejects stale updates without changing state, revision or audit', async () => {
		const created = await create()
		const id = created.body.flag.id as string
		await request(server)
			.patch('/feature-flags/' + id)
			.set('Cookie', developerCookies)
			.send({ enabled: true, expectedVersion: 0 })
			.expect(409)
		expect(
			(await prisma.featureFlagsRevision.findUniqueOrThrow({ where: { id: 'global' } }))
				.version,
		).toBe(1)
		expect(await prisma.featureFlagAudit.count()).toBe(1)
		expect((await prisma.featureFlag.findUniqueOrThrow({ where: { id } })).enabled).toBe(
			false,
		)
	})
	it('rejects duplicate keys including archived keys; permits duplicate titles with a new key', async () => {
		const created = await create()
		const id = created.body.flag.id as string
		await request(server)
			.post('/feature-flags')
			.set('Cookie', developerCookies)
			.send(newFlag)
			.expect(409)
		await request(server)
			.post('/feature-flags/' + id + '/archive')
			.set('Cookie', developerCookies)
			.send({ expectedVersion: 1 })
			.expect(201)
		await request(server)
			.post('/feature-flags')
			.set('Cookie', developerCookies)
			.send(newFlag)
			.expect(409)
		await request(server)
			.post('/feature-flags')
			.set('Cookie', developerCookies)
			.send({ ...newFlag, key: 'boards-redesign-v3' })
			.expect(201)
		const snapshot = await request(server)
			.get('/feature-flags/snapshot')
			.set('Cookie', userCookies)
		expect(
			snapshot.body.flags.some((flag: { key: string }) => flag.key === newFlag.key),
		).toBe(false)
		const list = await request(server)
			.get('/feature-flags')
			.set('Cookie', developerCookies)
			.expect(200)
		expect(
			list.body.flags.find((flag: { id: string }) => flag.id === id).archivedAt,
		).toBeTruthy()
		await request(server)
			.patch('/feature-flags/' + id)
			.set('Cookie', developerCookies)
			.send({ enabled: true, expectedVersion: 3 })
			.expect(409)
	})
	it('protects flags still referenced by supported code', async () => {
		const flag = await prisma.featureFlag.findUniqueOrThrow({ where: { key: 'boards' } })
		await request(server)
			.post('/feature-flags/' + flag.id + '/archive')
			.set('Cookie', developerCookies)
			.send({ expectedVersion: 0 })
			.expect(409)
		expect(await prisma.featureFlagAudit.count()).toBe(0)
	})
	it.each([
		{ ...newFlag, key: 'INVALID_KEY' },
		{ ...newFlag, enabled: 'yes' },
		{ ...newFlag, title: '' },
	])('validates flag requests with 422: %j', async (body) => {
		await request(server)
			.post('/feature-flags')
			.set('Cookie', developerCookies)
			.send(body)
			.expect(422)
	})
	it('rejects technical key renaming and returns 404 for an unknown ID', async () => {
		const created = await create()
		await request(server)
			.patch('/feature-flags/' + created.body.flag.id)
			.set('Cookie', developerCookies)
			.send({ key: 'renamed', expectedVersion: 1 })
			.expect(422)
		await request(server)
			.patch('/feature-flags/missing')
			.set('Cookie', developerCookies)
			.send({ enabled: true, expectedVersion: 1 })
			.expect(404)
	})
})
