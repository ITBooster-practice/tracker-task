import {
	ConflictException,
	NotFoundException,
	UnprocessableEntityException,
} from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { PrismaService } from '../../../prisma/prisma.service'
import { Prisma } from '../../../generated/prisma/client'
import { FeatureFlagsService } from '../../../src/feature-flags/feature-flags.service'

const base = {
	id: 'flag',
	key: 'boards',
	enabled: false,
	updatedAt: new Date('2026-10-10T00:00:00Z'),
}
function setup() {
	const prisma = {
		featureFlag: {
			findUnique: vi.fn().mockResolvedValue(base),
			findMany: vi.fn().mockResolvedValue([base]),
			update: vi
				.fn()
				.mockImplementation(({ data }) => Promise.resolve({ ...base, ...data })),
		},
		featureFlagsRevision: {
			findUniqueOrThrow: vi.fn().mockResolvedValue({ version: 4 }),
			update: vi.fn().mockResolvedValue({ version: 5 }),
		},
		$transaction: vi.fn(),
	}
	prisma.$transaction.mockImplementation((fn) => fn(prisma))
	const service = new FeatureFlagsService(prisma as unknown as PrismaService)
	const event = vi.fn()
	service.changes.subscribe(event)
	return { prisma, service, event }
}
describe('Feature flag transactions', () => {
	it('changes only the state and notifies after the transaction commits', async () => {
		const { service, prisma, event } = setup()
		const result = await service.update(base.id, { enabled: true, expectedVersion: 4 })
		expect(result).toEqual({
			version: 5,
			flag: {
				...base,
				enabled: true,
				updatedAt: base.updatedAt.toISOString(),
				connectedFeature: 'Доски',
			},
		})
		expect(prisma.featureFlag.update).toHaveBeenCalledWith({
			where: { id: base.id },
			data: { enabled: true },
		})
		expect(event).toHaveBeenCalledWith(5)
	})
	it.each(['search-v1', 'constructor', 'toString'])(
		'does not enable an unconnected key: %s',
		async (key) => {
			const { service, prisma, event } = setup()
			prisma.featureFlag.findUnique.mockResolvedValue({ ...base, key })
			await expect(
				service.update(base.id, { enabled: true, expectedVersion: 4 }),
			).rejects.toBeInstanceOf(UnprocessableEntityException)
			expect(prisma.featureFlag.update).not.toHaveBeenCalled()
			expect(event).not.toHaveBeenCalled()
		},
	)
	it('allows disabling an old enabled but unconnected record', async () => {
		const { service, prisma } = setup()
		prisma.featureFlag.findUnique.mockResolvedValue({
			...base,
			key: 'old-key',
			enabled: true,
		})
		await service.update(base.id, { enabled: false, expectedVersion: 4 })
		expect(prisma.featureFlag.update).toHaveBeenCalledWith({
			where: { id: base.id },
			data: { enabled: false },
		})
	})
	it('rejects stale updates without changing the flag or notifying', async () => {
		const { service, prisma, event } = setup()
		await expect(
			service.update(base.id, { enabled: true, expectedVersion: 3 }),
		).rejects.toBeInstanceOf(ConflictException)
		expect(prisma.featureFlag.update).not.toHaveBeenCalled()
		expect(event).not.toHaveBeenCalled()
	})
	it('rejects a missing record without notifying', async () => {
		const { service, prisma, event } = setup()
		prisma.featureFlag.findUnique.mockResolvedValue(null)
		await expect(
			service.update('missing', { enabled: true, expectedVersion: 4 }),
		).rejects.toBeInstanceOf(NotFoundException)
		expect(prisma.featureFlag.update).not.toHaveBeenCalled()
		expect(event).not.toHaveBeenCalled()
	})
	it('does not notify if the transaction fails to commit', async () => {
		const { service, prisma, event } = setup()
		prisma.$transaction.mockRejectedValue(new Error('commit failed'))
		await expect(
			service.update(base.id, { enabled: true, expectedVersion: 4 }),
		).rejects.toThrow('commit failed')
		expect(event).not.toHaveBeenCalled()
	})
	it('reads a consistent snapshot and closes unconnected keys', async () => {
		const { service, prisma } = setup()
		prisma.featureFlag.findMany.mockResolvedValue([
			{ ...base, enabled: true },
			{ ...base, id: 'old', key: 'old-key', enabled: true },
		])
		expect(await service.snapshot()).toEqual({
			version: 4,
			flags: [
				{ key: 'boards', enabled: true, updatedAt: base.updatedAt.toISOString() },
				{ key: 'old-key', enabled: false, updatedAt: base.updatedAt.toISOString() },
			],
		})
		expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
			isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
		})
	})
	it('lists connection from code without lifecycle metadata', async () => {
		const { service, prisma } = setup()
		prisma.featureFlag.findMany.mockResolvedValue([base, { ...base, key: 'old-key' }])
		expect((await service.list()).flags).toEqual([
			{ ...base, updatedAt: base.updatedAt.toISOString(), connectedFeature: 'Доски' },
			{
				...base,
				key: 'old-key',
				updatedAt: base.updatedAt.toISOString(),
				connectedFeature: null,
			},
		])
		expect(await service.version()).toBe(4)
	})
})
