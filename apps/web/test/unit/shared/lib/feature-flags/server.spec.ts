import { notFound, redirect } from 'next/navigation'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FEATURE_KEYS } from '@repo/types'

import { featureFlagsService } from '@/shared/lib/feature-flags/feature-flags-service'
import { requireServerFeature } from '@/shared/lib/feature-flags/server'

vi.mock('react', async (original) => ({
	...(await original<typeof import('react')>()),
	cache: (fn: unknown) => fn,
}))
vi.mock('next/navigation', () => ({
	notFound: vi.fn(() => {
		throw new Error('404')
	}),
	redirect: vi.fn(() => {
		throw new Error('redirect')
	}),
}))
vi.mock('@/shared/lib/feature-flags/feature-flags-service', () => ({
	featureFlagsService: { snapshot: vi.fn() },
}))
describe('Server feature access', () => {
	afterEach(() => {
		vi.clearAllMocks()
		vi.unstubAllEnvs()
	})
	it('denies direct routes for missing or disabled keys', async () => {
		vi.mocked(featureFlagsService.snapshot).mockResolvedValue({ version: 1, flags: [] })
		await expect(requireServerFeature('boards')).rejects.toThrow('404')
		expect(notFound).toHaveBeenCalledOnce()
	})
	it('allows routes when parent features are enabled', async () => {
		vi.mocked(featureFlagsService.snapshot).mockResolvedValue({
			version: 1,
			flags: Object.values(FEATURE_KEYS).map((key) => ({
				key,
				enabled: true,
				updatedAt: '2026-10-10T00:00:00Z',
			})),
		})
		await expect(requireServerFeature('boards')).resolves.toBeUndefined()
	})
	it('redirects unauthenticated requests to login', async () => {
		vi.mocked(featureFlagsService.snapshot).mockRejectedValue({
			statusCode: 401,
			message: 'Unauthorized',
		})
		await expect(requireServerFeature('boards')).rejects.toThrow('redirect')
		expect(redirect).toHaveBeenCalledWith('/login')
	})
	it('fails closed on API failures in production even with fallback configured', async () => {
		vi.stubEnv('NODE_ENV', 'production')
		vi.stubEnv('NEXT_PUBLIC_FEATURE_FLAGS_DEV_FALLBACK', 'true')
		vi.mocked(featureFlagsService.snapshot).mockRejectedValue(new Error('offline'))
		await expect(requireServerFeature('boards')).rejects.toThrow('offline')
	})
	it('allows explicitly opted-in development fallback', async () => {
		vi.stubEnv('NODE_ENV', 'development')
		vi.stubEnv('NEXT_PUBLIC_FEATURE_FLAGS_DEV_FALLBACK', 'true')
		vi.mocked(featureFlagsService.snapshot).mockRejectedValue(new Error('offline'))
		await expect(requireServerFeature('boards')).resolves.toBeUndefined()
	})
})
