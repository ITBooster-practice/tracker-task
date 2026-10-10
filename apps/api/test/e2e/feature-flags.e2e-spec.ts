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
	const newFlag = { key: 'boards-redesign-v2', title: 'Обновление досок', enabled: false }
	async function create() {
		return request(server)
			.post('/feature-flags')
			.set('Cookie', developerCookies)
			.send(newFlag)
			.expect(201)
	}

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
	it('creates, toggles, edits and audits in monotonically versioned transactions', async () => {
		const created = await create()
		const id = created.body.flag.id as string
		expect(created.body.version).toBe(1)
		const updated = await request(server)
			.patch('/feature-flags/' + id)
			.set('Cookie', developerCookies)
			.send({ enabled: true, title: 'Новое название', expectedVersion: 1 })
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
			after: { enabled: true },
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
