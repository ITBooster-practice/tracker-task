import { afterEach, describe, expect, it, vi } from 'vitest'

describe('getFeatureFlag', () => {
	afterEach(() => {
		vi.unstubAllEnvs()
		vi.resetModules()
	})

	it('возвращает true для включённой фичи', async () => {
		vi.stubEnv('NEXT_PUBLIC_FEATURE_TASKS', 'true')

		const { getFeatureFlag } = await import('@/shared/config/feature-flags')

		expect(getFeatureFlag('TASKS')).toBe(true)
	})

	it('возвращает false для выключенной фичи', async () => {
		vi.stubEnv('NEXT_PUBLIC_FEATURE_TASKS', '')

		const { getFeatureFlag } = await import('@/shared/config/feature-flags')

		expect(getFeatureFlag('TASKS')).toBe(false)
	})

	it('"TRUE" (uppercase) НЕ включает фичу — строгое сравнение', async () => {
		vi.stubEnv('NEXT_PUBLIC_FEATURE_TASKS', 'TRUE')

		const { getFeatureFlag } = await import('@/shared/config/feature-flags')

		expect(getFeatureFlag('TASKS')).toBe(false)
	})
})
