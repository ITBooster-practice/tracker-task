import { EventEmitter } from 'node:events'
import { JwtService } from '@nestjs/jwt'
import { Redis } from 'ioredis'
import { Subject } from 'rxjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MessageEvent } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { FeatureFlagsService } from '../../../src/feature-flags/feature-flags.service'
import {
	FEATURE_FLAGS_CHANNEL,
	FeatureFlagsEventsService,
} from '../../../src/feature-flags/feature-flags-events.service'

function setup() {
	const subscriber = Object.assign(new EventEmitter(), {
		connect: vi.fn().mockResolvedValue(undefined),
		subscribe: vi.fn().mockResolvedValue(1),
		disconnect: vi.fn(),
	})
	const publisher = {
		duplicate: vi.fn().mockReturnValue(subscriber),
		publish: vi.fn().mockResolvedValue(1),
	}
	const flags = { changes: new Subject<number>(), version: vi.fn().mockResolvedValue(1) }
	const jwt = {
		decode: vi.fn().mockReturnValue({ exp: Date.now() / 1000 + 3600 }),
		verifyAsync: vi.fn().mockResolvedValue({ id: 'user' }),
	}
	const prisma = { user: { findUnique: vi.fn().mockResolvedValue({ id: 'user' }) } }
	const service = new FeatureFlagsEventsService(
		publisher as unknown as Redis,
		flags as unknown as FeatureFlagsService,
		jwt as unknown as JwtService,
		prisma as unknown as PrismaService,
	)
	service.onModuleInit()
	return { service, subscriber, publisher, flags, jwt, prisma }
}
const flush = async () => {
	for (let i = 0; i < 8; i++) await Promise.resolve()
}
describe('Flag notification recovery and session lifecycle', () => {
	beforeEach(() => vi.useFakeTimers())
	afterEach(() => vi.useRealTimers())
	it('publishes committed local revisions and forwards Redis messages to streams', async () => {
		const { service, subscriber, publisher, flags } = setup()
		const events: MessageEvent[] = []
		const stream = service
			.stream('cookie', 'user')
			.subscribe((event) => events.push(event))
		await flush()
		flags.changes.next(2)
		subscriber.emit('ready')
		subscriber.emit('message', FEATURE_FLAGS_CHANNEL, '3')
		subscriber.emit('message', 'other', '9')
		subscriber.emit('message', FEATURE_FLAGS_CHANNEL, 'invalid')
		subscriber.emit('message', FEATURE_FLAGS_CHANNEL, '-1')
		await flush()
		expect(publisher.publish).toHaveBeenCalledWith(FEATURE_FLAGS_CHANNEL, '2')
		expect(subscriber.subscribe).toHaveBeenCalledWith(FEATURE_FLAGS_CHANNEL)
		expect(
			events
				.filter((event) => event.type === 'feature-flags-changed')
				.map((event) => event.data),
		).toContainEqual({ version: 3 })
		expect(events.map((event) => event.data)).not.toContainEqual({ version: 9 })
		stream.unsubscribe()
		service.onModuleDestroy()
		expect(subscriber.disconnect).toHaveBeenCalled()
		expect(vi.getTimerCount()).toBe(0)
	})
	it('recovers failed publish via periodic DB revision checks', async () => {
		const { service, subscriber, publisher, flags } = setup()
		await flush()
		publisher.publish.mockRejectedValue(new Error('Redis offline'))
		subscriber.emit('error', new Error('offline'))
		const events: MessageEvent[] = []
		const stream = service
			.stream('cookie', 'user')
			.subscribe((event) => events.push(event))
		flags.changes.next(2)
		flags.version.mockResolvedValue(3)
		await vi.advanceTimersByTimeAsync(5000)
		expect(events.map((event) => event.data)).toContainEqual({ version: 3 })
		stream.unsubscribe()
		service.onModuleDestroy()
	})
	it('handles connection and subscription failures and continues DB recovery', async () => {
		const { service, subscriber, flags } = setup()
		subscriber.subscribe.mockRejectedValue(new Error('subscribe unavailable'))
		subscriber.emit('ready')
		flags.version.mockRejectedValue(new Error('DB unavailable'))
		await flush()
		await service.reconcile()
		flags.version.mockResolvedValue(4)
		await service.reconcile()
		service.onModuleDestroy()
		await service.reconcile()
	})
	it('closes a stream at the access-token expiry and cancels its timers', async () => {
		const { service, jwt } = setup()
		jwt.decode.mockReturnValue({ exp: Date.now() / 1000 + 1 })
		const events: MessageEvent[] = []
		const completed = vi.fn()
		service
			.stream('cookie', 'user')
			.subscribe({ next: (event) => events.push(event), complete: completed })
		await vi.advanceTimersByTimeAsync(1000)
		expect(events.at(-1)?.type).toBe('session-expired')
		expect(completed).toHaveBeenCalledOnce()
		service.onModuleDestroy()
		expect(vi.getTimerCount()).toBe(0)
	})
	it('sends heartbeat only while the JWT and account remain valid', async () => {
		const { service, prisma } = setup()
		const events: MessageEvent[] = []
		const completed = vi.fn()
		service
			.stream('cookie', 'user')
			.subscribe({ next: (event) => events.push(event), complete: completed })
		await vi.advanceTimersByTimeAsync(15000)
		expect(events.at(-1)?.type).toBe('heartbeat')
		prisma.user.findUnique.mockResolvedValue(null)
		await vi.advanceTimersByTimeAsync(15000)
		expect(events.at(-1)?.type).toBe('session-expired')
		expect(completed).toHaveBeenCalledOnce()
		service.onModuleDestroy()
	})
	it('closes rather than continuing when authorization fails', async () => {
		const { service, jwt } = setup()
		jwt.verifyAsync.mockRejectedValue(new Error('invalid'))
		const completed = vi.fn()
		service.stream('cookie', 'user').subscribe({ complete: completed })
		await vi.advanceTimersByTimeAsync(15000)
		expect(completed).toHaveBeenCalledOnce()
		service.onModuleDestroy()
	})
	it('does not authorize a JWT belonging to another account', async () => {
		const { service, jwt, prisma } = setup()
		jwt.verifyAsync.mockResolvedValue({ id: 'other' })
		const completed = vi.fn()
		service.stream('cookie', 'user').subscribe({ complete: completed })
		await vi.advanceTimersByTimeAsync(15000)
		expect(prisma.user.findUnique).not.toHaveBeenCalled()
		expect(completed).toHaveBeenCalledOnce()
		service.onModuleDestroy()
	})
	it('closes if the initial snapshot version cannot be read', async () => {
		const { service, flags } = setup()
		flags.version.mockRejectedValue(new Error('unavailable'))
		const completed = vi.fn()
		service.stream('cookie', 'user').subscribe({ complete: completed })
		await flush()
		expect(completed).toHaveBeenCalledOnce()
		service.onModuleDestroy()
	})
	it('completes open connections when the module is destroyed', async () => {
		const { service } = setup()
		const completed = vi.fn()
		service.stream('cookie', 'user').subscribe({ complete: completed })
		await flush()
		service.onModuleDestroy()
		expect(completed).toHaveBeenCalledOnce()
		expect(vi.getTimerCount()).toBe(0)
	})
})
