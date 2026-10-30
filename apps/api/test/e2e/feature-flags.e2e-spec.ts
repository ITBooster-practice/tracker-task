import type { Server } from 'http'
import type { INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FEATURE_KEYS } from '@repo/types'
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
		await prisma.featureFlag.deleteMany({
			where: { key: { notIn: Object.values(FEATURE_KEYS) } },
		})
		await prisma.featureFlag.updateMany({ data: { enabled: true } })
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
		await prisma.featureFlag.deleteMany({
			where: { key: { notIn: Object.values(FEATURE_KEYS) } },
		})
		await prisma.featureFlag.updateMany({ data: { enabled: true } })
		await redis.flushall()
		await app.close()
		await prisma.$disconnect()
	})
	it('keeps projects and team administration available with flags off, preserving permissions', async () => {
		await prisma.featureFlag.updateMany({ data: { enabled: false } })
		const team = await request(server)
			.post('/teams/new')
			.set('Cookie', developerCookies)
			.send({ name: 'Feature team' })
			.expect(201)
		const teamPath = '/teams/' + team.body.id
		const projectPath = teamPath + '/projects'
		const project = await request(server)
			.post(projectPath)
			.set('Cookie', developerCookies)
			.send({ name: 'Feature project' })
			.expect(201)
		const detailPath = projectPath + '/' + project.body.id
		await request(server).get(projectPath).expect(401)
		await request(server)
			.get(teamPath + '/members')
			.expect(401)
		for (const path of [
			projectPath,
			detailPath,
			teamPath,
			teamPath + '/members',
			teamPath + '/invitations',
		]) {
			await request(server).get(path).set('Cookie', developerCookies).expect(200)
			await request(server).get(path).set('Cookie', userCookies).expect(403)
		}
		const member = await prisma.user.findUniqueOrThrow({
			where: { email: 'ordinary@example.com' },
		})
		await prisma.teamMember.create({
			data: { teamId: team.body.id, userId: member.id, role: 'MEMBER' },
		})
		await request(server).get(projectPath).set('Cookie', userCookies).expect(200)
		await request(server)
			.get(teamPath + '/members')
			.set('Cookie', userCookies)
			.expect(200)
		for (const [method, path, body] of [
			['patch', detailPath, { name: 'Forbidden' }],
			['delete', detailPath, {}],
			['patch', teamPath, { name: 'Forbidden' }],
			['delete', teamPath, {}],
			['get', teamPath + '/invitations', {}],
			[
				'post',
				teamPath + '/invitations',
				{ email: 'invite@example.com', role: 'MEMBER' },
			],
			['patch', teamPath + '/members/' + developerId + '/role', { role: 'MEMBER' }],
			['delete', teamPath + '/members/' + developerId, {}],
		] as const) {
			await request(server)
				[method](path)
				.set('Cookie', userCookies)
				.send(body)
				.expect(403)
		}
		await prisma.teamMember.update({
			where: { teamId_userId: { teamId: team.body.id, userId: member.id } },
			data: { role: 'ADMIN' },
		})
		await request(server)
			.patch(teamPath)
			.set('Cookie', userCookies)
			.send({ name: 'Renamed' })
			.expect(200)
		await request(server)
			.patch(detailPath)
			.set('Cookie', userCookies)
			.send({ name: 'Renamed' })
			.expect(200)
		const invitation = await request(server)
			.post(teamPath + '/invitations')
			.set('Cookie', userCookies)
			.send({ email: 'invite@example.com', role: 'MEMBER' })
			.expect(201)
		await request(server)
			.delete(teamPath + '/invitations/' + invitation.body.id)
			.set('Cookie', userCookies)
			.expect(200)
		await request(server).delete(teamPath).set('Cookie', userCookies).expect(403)
		await request(server).delete(detailPath).set('Cookie', userCookies).expect(204)
		await request(server).delete(teamPath).set('Cookie', developerCookies).expect(200)
	})

	it('still blocks tasks and boards through their own flags', async () => {
		const team = await request(server)
			.post('/teams/new')
			.set('Cookie', developerCookies)
			.send({ name: 'Feature team' })
			.expect(201)
		const projectPath = '/teams/' + team.body.id + '/projects'
		const project = await request(server)
			.post(projectPath)
			.set('Cookie', developerCookies)
			.send({ name: 'Feature project' })
			.expect(201)
		const taskPath = projectPath + '/' + project.body.id + '/tasks'
		await prisma.featureFlag.update({
			where: { key: FEATURE_KEYS.TASKS },
			data: { enabled: false },
		})
		for (const [method, path] of [
			['get', taskPath],
			['post', taskPath],
			['get', taskPath + '/missing'],
			['patch', taskPath + '/missing'],
			['patch', taskPath + '/missing/move'],
			['delete', taskPath + '/missing'],
			['get', taskPath + '/board'],
		] as const) {
			const blocked = await request(server)
				[method](path)
				.set('Cookie', developerCookies)
				.send({ title: 'Blocked' })
				.expect(403)
			expect(blocked.body.code).toBe('FEATURE_DISABLED')
		}
		await prisma.featureFlag.update({
			where: { key: FEATURE_KEYS.TASKS },
			data: { enabled: true },
		})
		await prisma.featureFlag.update({
			where: { key: FEATURE_KEYS.BOARDS },
			data: { enabled: false },
		})
		await request(server)
			.get(taskPath + '/board')
			.set('Cookie', developerCookies)
			.expect(403)
		await request(server).get(taskPath).set('Cookie', developerCookies).expect(200)
	})

	it('requires authentication for snapshot and state changes', async () => {
		const flag = await prisma.featureFlag.findUniqueOrThrow({ where: { key: 'boards' } })
		await request(server).get('/feature-flags/snapshot').expect(401)
		await request(server)
			.patch('/feature-flags/' + flag.id)
			.send({ enabled: false, expectedVersion: 0 })
			.expect(401)
	})
	it('allows snapshots but denies ordinary users and team owners management', async () => {
		const flag = await prisma.featureFlag.findUniqueOrThrow({ where: { key: 'boards' } })
		await request(server)
			.get('/feature-flags/snapshot')
			.set('Cookie', userCookies)
			.expect(200)
		expect(
			(await request(server).get('/feature-flags/access').set('Cookie', userCookies)).body
				.canManage,
		).toBe(false)
		await request(server)
			.post('/teams/new')
			.set('Cookie', userCookies)
			.send({ name: 'Owner team' })
			.expect(201)
		await request(server).get('/feature-flags').set('Cookie', userCookies).expect(403)
		await request(server)
			.patch('/feature-flags/' + flag.id)
			.set('Cookie', userCookies)
			.send({ enabled: false, expectedVersion: 0 })
			.expect(403)
		app.get(ConfigService).set('SYSTEM_DEVELOPER_USER_ID', '')
		await request(server)
			.get('/feature-flags')
			.set('Cookie', developerCookies)
			.expect(403)
		await request(server)
			.patch('/feature-flags/' + flag.id)
			.set('Cookie', developerCookies)
			.send({ enabled: false, expectedVersion: 0 })
			.expect(403)
	})
	it('returns versioned snapshots and conditional 304 responses', async () => {
		const snapshot = await request(server)
			.get('/feature-flags/snapshot')
			.set('Cookie', userCookies)
			.expect(200)
		expect(snapshot.body.version).toBe(0)
		expect(snapshot.body.flags.map((flag: { key: string }) => flag.key).sort()).toEqual(
			Object.values(FEATURE_KEYS).sort(),
		)
		expect(Object.keys(snapshot.body.flags[0] as Record<string, unknown>).sort()).toEqual(
			['enabled', 'key', 'updatedAt'],
		)
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
	it('lists code connections and toggles without lifecycle metadata', async () => {
		const list = await request(server)
			.get('/feature-flags')
			.set('Cookie', developerCookies)
			.expect(200)
		const boards = list.body.flags.find((flag: { key: string }) => flag.key === 'boards')
		expect(boards.connectedFeature).toBe('Доски')
		expect(Object.keys(boards as Record<string, unknown>).sort()).toEqual([
			'connectedFeature',
			'enabled',
			'id',
			'key',
			'updatedAt',
		])
		for (const [expectedVersion, enabled] of [
			[0, false],
			[1, true],
		] as const) {
			const updated = await request(server)
				.patch('/feature-flags/' + boards.id)
				.set('Cookie', developerCookies)
				.send({ enabled, expectedVersion })
				.expect(200)
			expect(updated.body).toMatchObject({
				version: expectedVersion + 1,
				flag: { enabled, connectedFeature: 'Доски' },
			})
		}
	})
	it.each([
		[FEATURE_KEYS.AI_ASSISTANT, 'AI Ассистент'],
		[FEATURE_KEYS.NOTIFICATIONS, 'Уведомления'],
	])(
		'manages the connected %s flag and reflects its state in snapshots',
		async (key, label) => {
			const list = await request(server)
				.get('/feature-flags')
				.set('Cookie', developerCookies)
				.expect(200)
			const flag = list.body.flags.find((item: { key: string }) => item.key === key)
			expect(flag.connectedFeature).toBe(label)
			for (const [expectedVersion, enabled] of [
				[0, false],
				[1, true],
			] as const) {
				await request(server)
					.patch('/feature-flags/' + flag.id)
					.set('Cookie', developerCookies)
					.send({ enabled, expectedVersion })
					.expect(200)
				const snapshot = await request(server)
					.get('/feature-flags/snapshot')
					.set('Cookie', userCookies)
					.expect(200)
				expect(snapshot.body.version).toBe(expectedVersion + 1)
				expect(
					snapshot.body.flags.find((item: { key: string }) => item.key === key).enabled,
				).toBe(enabled)
			}
		},
	)
	it('keeps database-created flags disabled and cannot enable them until connected', async () => {
		// Имитируем запись из миграции: API создания флагов отсутствует.
		const flag = await prisma.featureFlag.create({ data: { key: 'new-release' } })
		expect(flag.enabled).toBe(false)
		await request(server)
			.patch('/feature-flags/' + flag.id)
			.set('Cookie', developerCookies)
			.send({ enabled: true, expectedVersion: 0 })
			.expect(422)
		expect(
			(await prisma.featureFlagsRevision.findUniqueOrThrow({ where: { id: 'global' } }))
				.version,
		).toBe(0)
		expect(
			(await prisma.featureFlag.findUniqueOrThrow({ where: { id: flag.id } })).enabled,
		).toBe(false)
		const list = await request(server)
			.get('/feature-flags')
			.set('Cookie', developerCookies)
			.expect(200)
		expect(
			list.body.flags.find((item: { id: string }) => item.id === flag.id),
		).toMatchObject({ connectedFeature: null, enabled: false })
		// Старое включённое состояние не открывает функцию без подключения в текущем коде.
		await prisma.featureFlag.update({ where: { id: flag.id }, data: { enabled: true } })
		const snapshot = await request(server)
			.get('/feature-flags/snapshot')
			.set('Cookie', userCookies)
			.expect(200)
		expect(
			snapshot.body.flags.find((item: { key: string }) => item.key === flag.key).enabled,
		).toBe(false)
		await request(server)
			.patch('/feature-flags/' + flag.id)
			.set('Cookie', developerCookies)
			.send({ enabled: false, expectedVersion: 0 })
			.expect(200)
	})
	it('rolls back rejected mutations and serializes concurrent toggles', async () => {
		const flag = await prisma.featureFlag.findUniqueOrThrow({ where: { key: 'boards' } })
		const results = await Promise.all(
			[true, false].map((enabled) =>
				request(server)
					.patch('/feature-flags/' + flag.id)
					.set('Cookie', developerCookies)
					.send({ enabled, expectedVersion: 0 }),
			),
		)
		expect(results.map((response) => response.status).sort()).toEqual([200, 409])
		const winner = results.find((response) => response.status === 200)!
		const saved = await prisma.featureFlag.findUniqueOrThrow({ where: { id: flag.id } })
		expect(saved.enabled).toBe(winner.body.flag.enabled)
		expect(
			(await prisma.featureFlagsRevision.findUniqueOrThrow({ where: { id: 'global' } }))
				.version,
		).toBe(1)
		await request(server)
			.patch('/feature-flags/missing')
			.set('Cookie', developerCookies)
			.send({ enabled: true, expectedVersion: 1 })
			.expect(404)
		expect(
			(await prisma.featureFlagsRevision.findUniqueOrThrow({ where: { id: 'global' } }))
				.version,
		).toBe(1)
	})
	it.each([
		{ enabled: true },
		{ expectedVersion: 0 },
		{ enabled: 'yes', expectedVersion: 0 },
		{ enabled: true, expectedVersion: 0, key: 'renamed' },
		{ enabled: true, expectedVersion: 0, title: 'Edited' },
		{ enabled: true, expectedVersion: 0, description: 'Description' },
		{ enabled: true, expectedVersion: 0, expiresAt: null },
		{ enabled: true, expectedVersion: 0, connectedFeature: 'Spoofed' },
	])('rejects non-state requests without changing the revision: %j', async (body) => {
		const flag = await prisma.featureFlag.findUniqueOrThrow({ where: { key: 'boards' } })
		await request(server)
			.patch('/feature-flags/' + flag.id)
			.set('Cookie', developerCookies)
			.send(body)
			.expect(422)
		expect(
			(await prisma.featureFlagsRevision.findUniqueOrThrow({ where: { id: 'global' } }))
				.version,
		).toBe(0)
	})
	it('does not expose runtime creation, deletion, archiving, history or deadlines', async () => {
		const flag = await prisma.featureFlag.findUniqueOrThrow({ where: { key: 'boards' } })
		await request(server)
			.post('/feature-flags')
			.set('Cookie', developerCookies)
			.send({ key: 'draft' })
			.expect(404)
		await request(server)
			.delete('/feature-flags/' + flag.id)
			.set('Cookie', developerCookies)
			.expect(404)
		await request(server)
			.post('/feature-flags/' + flag.id + '/archive')
			.set('Cookie', developerCookies)
			.expect(404)
		await request(server)
			.get('/feature-flags/' + flag.id + '/audit')
			.set('Cookie', developerCookies)
			.expect(404)
		await request(server)
			.get('/feature-flags/server-time')
			.set('Cookie', developerCookies)
			.expect(404)
	})
})
