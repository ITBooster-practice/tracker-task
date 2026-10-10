import type { Server } from 'http'
import type { INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Redis } from 'ioredis'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { PrismaService } from '../../prisma/prisma.service'
import { FeatureFlagsEventsService } from '../../src/feature-flags/feature-flags-events.service'
import { createTestApp, registerAndLogin, resetE2eState } from '../helpers/e2e.helpers'

describe('Feature flag SSE across API instances (e2e)', () => {
	let first: INestApplication,
		second: INestApplication,
		prisma: PrismaService,
		redis: Redis,
		redisSecond: Redis
	let url: string, cookies: string, userId: string
	beforeAll(async () => {
		const one = await createTestApp(),
			two = await createTestApp()
		first = one.app
		second = two.app
		prisma = one.prisma
		redis = one.redisClient
		redisSecond = two.redisClient
		await second.listen(0, '127.0.0.1')
		url = await second.getUrl()
	})
	beforeEach(async () => {
		await resetE2eState(prisma, redis)
		await prisma.featureFlagAudit.deleteMany()
		await prisma.featureFlag.deleteMany({ where: { key: { startsWith: 'sse-' } } })
		cookies = (await registerAndLogin(first, 'sse-developer@example.com')).cookies
		userId = (
			await prisma.user.findUniqueOrThrow({
				where: { email: 'sse-developer@example.com' },
			})
		).id
		first.get(ConfigService).set('SYSTEM_DEVELOPER_USER_ID', userId)
		await second.get(FeatureFlagsEventsService).reconcile()
	})
	afterAll(async () => {
		await prisma.featureFlagAudit.deleteMany()
		await prisma.featureFlag.deleteMany({ where: { key: { startsWith: 'sse-' } } })
		await first.close()
		await second.close()
		await prisma.$disconnect()
		await second.get(PrismaService).$disconnect()
		redis.disconnect()
		redisSecond.disconnect()
	})
	async function connect(cookie = cookies) {
		const abort = new AbortController()
		const response = await fetch(url + '/feature-flags/events', {
			headers: { Cookie: cookie },
			signal: abort.signal,
		})
		expect(response.status).toBe(200)
		expect(response.headers.get('content-type')).toContain('text/event-stream')
		const reader = response.body!.getReader(),
			decoder = new TextDecoder()
		let buffer = ''
		async function waitForVersion(version: number) {
			const timeout = setTimeout(() => abort.abort(), 10000)
			try {
				while (!buffer.includes('"version":' + version + '}')) {
					const item = await reader.read()
					if (item.done) throw Error('Stream ended before expected version')
					buffer += decoder.decode(item.value, { stream: true })
				}
			} finally {
				clearTimeout(timeout)
			}
		}
		return { abort, reader, waitForVersion }
	}
	it('rejects unauthenticated event connections', async () => {
		expect((await fetch(url + '/feature-flags/events')).status).toBe(401)
	})
	it('delivers an update from a different API instance and resynchronizes on reconnect', async () => {
		const current = await prisma.featureFlagsRevision.findUniqueOrThrow({
			where: { id: 'global' },
		})
		const stream = await connect()
		try {
			await stream.waitForVersion(current.version)
			const created = await request(first.getHttpServer() as Server)
				.post('/feature-flags')
				.set('Cookie', cookies)
				.send({ key: 'sse-cross-instance', title: 'SSE test', enabled: false })
				.expect(201)
			await stream.waitForVersion(created.body.version as number)
			stream.abort.abort()
			const reconnect = await connect()
			try {
				await reconnect.waitForVersion(created.body.version as number)
			} finally {
				reconnect.abort.abort()
			}
		} finally {
			stream.abort.abort()
		}
	})
	it('recovers committed changes when publishing the Redis notification fails', async () => {
		const current = await prisma.featureFlagsRevision.findUniqueOrThrow({
			where: { id: 'global' },
		})
		const stream = await connect()
		const publish = vi
			.spyOn(redis, 'publish')
			.mockRejectedValue(new Error('Transport unavailable'))
		try {
			await stream.waitForVersion(current.version)
			const created = await request(first.getHttpServer() as Server)
				.post('/feature-flags')
				.set('Cookie', cookies)
				.send({ key: 'sse-lost-message', title: 'SSE retry', enabled: false })
				.expect(201)
			await second.get(FeatureFlagsEventsService).reconcile()
			await stream.waitForVersion(created.body.version as number)
		} finally {
			publish.mockRestore()
			stream.abort.abort()
		}
	})
	it('closes the stream when its access token expires', async () => {
		const token = first.get(JwtService).sign({ id: userId }, { expiresIn: 2 })
		const stream = await connect('accessToken=' + token)
		const timeout = setTimeout(() => stream.abort.abort(), 5000)
		let buffer = ''
		try {
			while (true) {
				const item = await stream.reader.read()
				if (item.done) break
				buffer += new TextDecoder().decode(item.value)
			}
			expect(buffer).toContain('session-expired')
		} finally {
			clearTimeout(timeout)
			stream.abort.abort()
		}
	})
})
