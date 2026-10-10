import { ForbiddenException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { PrismaService } from '../../../prisma/prisma.service'
import { FeatureFlagsService } from '../../../src/feature-flags/feature-flags.service'

describe('Feature availability', () => {
	it.each([
		null,
		{ enabled: false, archivedAt: null },
		{ enabled: true, archivedAt: new Date() },
	])('denies missing, disabled or archived flags: %j', async (flag) => {
		const prisma = { featureFlag: { findUnique: vi.fn().mockResolvedValue(flag) } }
		const service = new FeatureFlagsService(prisma as unknown as PrismaService)
		await expect(service.requireEnabled('unknown-key')).rejects.toThrow(
			ForbiddenException,
		)
	})
	it('allows only an active enabled flag', async () => {
		const prisma = {
			featureFlag: {
				findUnique: vi.fn().mockResolvedValue({ enabled: true, archivedAt: null }),
			},
		}
		expect(
			await new FeatureFlagsService(prisma as unknown as PrismaService).isEnabled(
				'boards',
			),
		).toBe(true)
	})
	it('does not execute guarded operations using stale state when the DB fails', async () => {
		const prisma = {
			featureFlag: { findUnique: vi.fn().mockRejectedValue(new Error('DB unavailable')) },
		}
		await expect(
			new FeatureFlagsService(prisma as unknown as PrismaService).requireEnabled(
				'boards',
			),
		).rejects.toThrow('DB unavailable')
	})
})
