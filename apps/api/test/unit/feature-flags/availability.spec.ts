import { ForbiddenException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { PrismaService } from '../../../prisma/prisma.service'
import { FeatureFlagsService } from '../../../src/feature-flags/feature-flags.service'

describe('Feature availability', () => {
	it.each([null, { enabled: false }])(
		'denies missing or disabled flags: %j',
		async (flag) => {
			const prisma = { featureFlag: { findUnique: vi.fn().mockResolvedValue(flag) } }
			const service = new FeatureFlagsService(prisma as unknown as PrismaService)
			await expect(service.requireEnabled('boards')).rejects.toThrow(ForbiddenException)
			expect(prisma.featureFlag.findUnique).toHaveBeenCalled()
		},
	)
	it('denies unconnected keys even when a database record is enabled', async () => {
		const prisma = {
			featureFlag: { findUnique: vi.fn().mockResolvedValue({ enabled: true }) },
		}
		const service = new FeatureFlagsService(prisma as unknown as PrismaService)
		await expect(service.requireEnabled('unknown-key')).rejects.toThrow(
			ForbiddenException,
		)
		expect(prisma.featureFlag.findUnique).not.toHaveBeenCalled()
	})
	it('allows an existing enabled and connected flag', async () => {
		const prisma = {
			featureFlag: { findUnique: vi.fn().mockResolvedValue({ enabled: true }) },
		}
		expect(
			await new FeatureFlagsService(prisma as unknown as PrismaService).isEnabled(
				'boards',
			),
		).toBe(true)
	})
	it('does not execute guarded operations when the DB fails', async () => {
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
