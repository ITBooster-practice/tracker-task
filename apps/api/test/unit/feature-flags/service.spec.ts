import {
	ConflictException,
	NotFoundException,
	UnprocessableEntityException,
} from '@nestjs/common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PrismaService } from '../../../prisma/prisma.service'
import { Prisma } from '../../../generated/prisma/client'
import { FeatureFlagsService } from '../../../src/feature-flags/feature-flags.service'

const base = {
	id: 'flag',
	key: 'search-v1',
	title: 'Search',
	description: null,
	enabled: false,
	archivedAt: null as Date | null,
	expiresAt: null as Date | null,
	createdById: 'developer',
	createdAt: new Date('2026-10-10T00:00:00Z'),
	updatedAt: new Date('2026-10-10T00:00:00Z'),
}
function setup() {
	const prisma = {
		featureFlag: {
			findUnique: vi.fn().mockResolvedValue(base),
			findMany: vi.fn().mockResolvedValue([base]),
			create: vi.fn().mockResolvedValue(base),
			update: vi.fn().mockResolvedValue(base),
		},
		user: { findMany: vi.fn().mockResolvedValue([{ id: 'developer', name: 'Макс' }]) },
		featureFlagsRevision: {
			findUniqueOrThrow: vi.fn().mockResolvedValue({ version: 4 }),
			update: vi.fn().mockResolvedValue({ version: 5 }),
		},
		featureFlagAudit: { create: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
		$transaction: vi.fn(),
	}
	prisma.$transaction.mockImplementation((fn) => fn(prisma))
	const service = new FeatureFlagsService(prisma as unknown as PrismaService)
	const event = vi.fn()
	service.changes.subscribe(event)
	return { prisma, service, event }
}
describe('Feature flag transactions', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-10-09T12:34:30Z').getTime())
	})
	afterEach(() => vi.restoreAllMocks())
	it.each(['2026-10-08T23:59:00Z', '2026-10-09T12:34:00Z', 'invalid'])(
		'rejects a new deadline before server time: %s',
		async (expiresAt) => {
			const { service, prisma, event } = setup()
			await expect(
				service.create('developer', {
					key: base.key,
					title: base.title,
					expiresAt,
				}),
			).rejects.toBeInstanceOf(UnprocessableEntityException)
			await expect(
				service.update('developer', base.id, { expiresAt, expectedVersion: 4 }),
			).rejects.toBeInstanceOf(UnprocessableEntityException)
			expect(prisma.featureFlag.create).not.toHaveBeenCalled()
			expect(prisma.featureFlag.update).not.toHaveBeenCalled()
			expect(prisma.featureFlagAudit.create).not.toHaveBeenCalled()
			expect(event).not.toHaveBeenCalled()
		},
	)

	it.each(['search-v1', 'constructor', 'toString'])(
		'не включает неподключённый ключ %s',
		async (key) => {
			const { service, prisma, event } = setup()
			prisma.featureFlag.findUnique.mockResolvedValue({ ...base, key })
			await expect(
				service.update('developer', base.id, { enabled: true, expectedVersion: 4 }),
			).rejects.toThrow('Флаг не подключён к приложению')
			expect(prisma.featureFlag.update).not.toHaveBeenCalled()
			expect(prisma.featureFlagAudit.create).not.toHaveBeenCalled()
			expect(event).not.toHaveBeenCalled()
		},
	)
	it('разрешает выключить ранее включённый неподключённый флаг', async () => {
		const { service, prisma } = setup()
		prisma.featureFlag.findUnique.mockResolvedValue({ ...base, enabled: true })
		await service.update('developer', base.id, { enabled: false, expectedVersion: 4 })
		expect(prisma.featureFlag.update).toHaveBeenCalledWith({
			where: { id: base.id },
			data: { enabled: false, expiresAt: undefined },
		})
	})
	it('не назначает подключение неизвестному ключу в списке', async () => {
		const { service } = setup()
		expect((await service.list()).flags[0]).toMatchObject({
			connectedFeature: null,
			required: false,
		})
	})
	it('создаёт подключённый флаг выключенным', async () => {
		const { service, prisma } = setup()
		await service.create('developer', { key: 'boards', title: 'Доски' })
		expect(prisma.featureFlag.create).toHaveBeenCalledWith({
			data: expect.objectContaining({ key: 'boards', enabled: false }),
		})
	})
	it('accepts a deadline equal to the server clock', async () => {
		const { service } = setup()
		await expect(
			service.create('developer', {
				key: base.key,
				title: base.title,
				expiresAt: new Date(Date.now()).toISOString(),
			}),
		).resolves.toMatchObject({ version: 5 })
	})
	it('allows preserving or clearing an unchanged historic deadline', async () => {
		const { service, prisma } = setup()
		const expiresAt = new Date('2026-10-08T12:00:45.123Z')
		prisma.featureFlag.findUnique.mockResolvedValue({ ...base, expiresAt })
		await expect(
			service.update('developer', base.id, {
				title: 'Changed',
				expiresAt: expiresAt.toISOString(),
				expectedVersion: 4,
			}),
		).resolves.toMatchObject({ version: 5 })
		await expect(
			service.update('developer', base.id, { expiresAt: null, expectedVersion: 4 }),
		).resolves.toMatchObject({ version: 5 })
	})
	it('reads a consistent snapshot without exposing management metadata', async () => {
		const { service, prisma } = setup()
		prisma.featureFlag.findMany.mockResolvedValue([
			{ key: base.key, enabled: false, updatedAt: base.updatedAt },
		] as (typeof base)[])
		expect(await service.snapshot()).toEqual({
			version: 4,
			flags: [{ key: base.key, enabled: false, updatedAt: base.updatedAt.toISOString() }],
		})
		expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
			isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
		})
	})
	it('includes archive and required-key status in the developer list', async () => {
		const { service, prisma } = setup()
		prisma.featureFlag.findMany.mockResolvedValue([
			{ ...base, key: 'boards', archivedAt: base.createdAt, expiresAt: base.createdAt },
		])
		expect((await service.list()).flags[0]).toMatchObject({
			required: true,
			connectedFeature: 'Доски',
			archivedAt: base.createdAt.toISOString(),
			expiresAt: base.createdAt.toISOString(),
		})
		expect(await service.version()).toBe(4)
	})
	it('получает имена авторов одним запросом и сохраняет записи без профиля', async () => {
		const { service, prisma } = setup()
		prisma.featureFlag.findMany.mockResolvedValue([
			base,
			{ ...base, id: 'second' },
			{ ...base, id: 'system', createdById: 'bootstrap' },
			{ ...base, id: 'deleted', createdById: 'deleted-user' },
			{ ...base, id: 'unnamed', createdById: 'unnamed-user' },
		])
		prisma.user.findMany.mockResolvedValue([
			{ id: 'developer', name: ' Макс ' },
			{ id: 'unnamed-user', name: '' },
		])
		const list = await service.list()
		expect(list.flags.map((flag) => flag.createdByName)).toEqual([
			'Макс',
			'Макс',
			'Система',
			null,
			null,
		])
		expect(prisma.user.findMany).toHaveBeenCalledOnce()
		expect(prisma.user.findMany).toHaveBeenCalledWith({
			where: { id: { in: ['developer', 'deleted-user', 'unnamed-user'] } },
			select: { id: true, name: true },
		})
	})
	it('показывает имя автора действия, сохраняя исходные данные истории', async () => {
		const { service, prisma } = setup()
		const entries = [
			{ actorId: 'developer', before: null, after: { createdById: 'other-author' } },
			{ actorId: 'bootstrap', before: null, after: null },
			{ actorId: 'deleted-user', before: null, after: null },
		]
		prisma.featureFlagAudit.findMany.mockResolvedValue(entries)
		expect(await service.audit(base.id)).toEqual(
			entries.map((entry, index) => ({
				...entry,
				actorName: ['Макс', 'Система', null][index],
			})),
		)
		expect(entries[0]).not.toHaveProperty('actorName')
		expect(prisma.user.findMany).toHaveBeenCalledOnce()
	})
	it('не запрашивает профили для системных записей и пустого списка', async () => {
		const { service, prisma } = setup()
		prisma.featureFlag.findMany.mockResolvedValue([{ ...base, createdById: 'bootstrap' }])
		expect((await service.list()).flags[0]?.createdByName).toBe('Система')
		prisma.featureFlag.findMany.mockResolvedValue([])
		expect((await service.list()).flags).toEqual([])
		await service.audit(base.id)
		expect(prisma.user.findMany).not.toHaveBeenCalled()
	})
	it('creates a flag, revision and audit before emitting a notification', async () => {
		const { service, prisma, event } = setup()
		const result = await service.create('developer', {
			key: base.key,
			title: 'Search',
			expiresAt: base.createdAt.toISOString(),
		})
		expect(result.version).toBe(5)
		expect(result.flag.createdByName).toBe('Макс')
		expect(prisma.featureFlag.create).toHaveBeenCalledWith({
			data: {
				key: base.key,
				title: 'Search',
				enabled: false,
				expiresAt: base.createdAt,
				createdById: 'developer',
			},
		})
		expect(prisma.featureFlagAudit.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				action: 'CREATE',
				actorId: 'developer',
				before: Prisma.DbNull,
				version: 5,
			}),
		})
		expect(event).toHaveBeenCalledWith(5)
	})
	it('creates an undated flag with a null expiry', async () => {
		const { service, prisma } = setup()
		await service.create('developer', { key: base.key, title: 'Search' })
		expect(prisma.featureFlag.create).toHaveBeenCalledWith({
			data: expect.objectContaining({ expiresAt: null }),
		})
	})
	it.each([undefined, null, '2026-11-10T00:00:00.000Z'])(
		'preserves, clears or changes expiry: %j',
		async (expiresAt) => {
			const { service, prisma } = setup()
			prisma.featureFlag.findUnique.mockResolvedValue({ ...base, key: 'boards' })
			await service.update('developer', base.id, {
				enabled: true,
				expectedVersion: 4,
				expiresAt,
			})
			expect(prisma.featureFlag.update).toHaveBeenCalledWith({
				where: { id: base.id },
				data: { enabled: true, expiresAt: expiresAt ? new Date(expiresAt) : expiresAt },
			})
			expect(prisma.featureFlagAudit.create).toHaveBeenCalledWith({
				data: expect.objectContaining({
					before: expect.objectContaining({ key: 'boards' }),
					action: 'UPDATE',
				}),
			})
		},
	)
	it('rejects stale mutations without applying changes or notifications', async () => {
		const { service, prisma, event } = setup()
		await expect(
			service.update('developer', base.id, { enabled: true, expectedVersion: 3 }),
		).rejects.toBeInstanceOf(ConflictException)
		expect(prisma.featureFlag.update).not.toHaveBeenCalled()
		expect(prisma.featureFlagAudit.create).not.toHaveBeenCalled()
		expect(event).not.toHaveBeenCalled()
	})
	it('does not notify if the transaction fails to commit', async () => {
		const { service, prisma, event } = setup()
		prisma.$transaction.mockRejectedValue(new Error('commit failed'))
		await expect(
			service.create('developer', { key: base.key, title: 'Search' }),
		).rejects.toThrow('commit failed')
		expect(event).not.toHaveBeenCalled()
	})
	it('archives custom flags without deleting their technical key', async () => {
		const { service, prisma } = setup()
		await service.archive('developer', base.id, 4)
		expect(prisma.featureFlag.update).toHaveBeenCalledWith({
			where: { id: base.id },
			data: { enabled: false, archivedAt: expect.any(Date) },
		})
		expect(prisma.featureFlagAudit.create).toHaveBeenCalledWith({
			data: expect.objectContaining({ action: 'ARCHIVE' }),
		})
	})
	it('blocks archive of required code keys', async () => {
		const { service, prisma } = setup()
		prisma.featureFlag.findUnique.mockResolvedValue({ ...base, key: 'projects' })
		await expect(service.archive('developer', base.id, 4)).rejects.toBeInstanceOf(
			ConflictException,
		)
		expect(prisma.featureFlag.update).not.toHaveBeenCalled()
	})
	it('rejects mutations of archived flags', async () => {
		const { service, prisma } = setup()
		prisma.featureFlag.findUnique.mockResolvedValue({
			...base,
			archivedAt: base.createdAt,
		})
		await expect(
			service.update('developer', base.id, { expectedVersion: 4, title: 'Changed' }),
		).rejects.toBeInstanceOf(ConflictException)
	})
	it('rejects unknown flags for both mutation and history', async () => {
		const { service, prisma } = setup()
		prisma.featureFlag.findUnique.mockResolvedValue(null)
		await expect(service.archive('developer', 'missing', 4)).rejects.toBeInstanceOf(
			NotFoundException,
		)
		await expect(service.audit('missing')).rejects.toBeInstanceOf(NotFoundException)
	})
	it('returns bounded audit history in revision order', async () => {
		const { service, prisma } = setup()
		await expect(service.audit(base.id)).resolves.toEqual([])
		expect(prisma.featureFlagAudit.findMany).toHaveBeenCalledWith({
			where: { flagId: base.id },
			orderBy: { version: 'desc' },
			take: 100,
		})
	})
	it('translates uniqueness failures to conflicts without sending notifications', async () => {
		const { service, prisma, event } = setup()
		prisma.$transaction.mockRejectedValue(
			new Prisma.PrismaClientKnownRequestError('duplicate', {
				code: 'P2002',
				clientVersion: '7.4.0',
			}),
		)
		await expect(
			service.create('developer', { key: base.key, title: base.title }),
		).rejects.toBeInstanceOf(ConflictException)
		expect(event).not.toHaveBeenCalled()
	})
})
