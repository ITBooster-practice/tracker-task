import { afterEach, describe, expect, it, vi } from 'vitest'

import { FEATURE_KEYS, type FeatureFlagsSnapshot } from '@repo/types'

import {
	getDevelopmentSnapshot,
	hasFeature,
} from '@/shared/lib/feature-flags/feature-flags'

const snapshot: FeatureFlagsSnapshot = {
	version: 4,
	flags: Object.values(FEATURE_KEYS).map((key) => ({
		key,
		enabled: true,
		updatedAt: '2026-10-10T00:00:00.000Z',
	})),
}
describe('Runtime flags', () => {
	afterEach(() => vi.unstubAllEnvs())
	it('fails closed without a snapshot or an unknown key', () => {
		expect(hasFeature(null, 'boards')).toBe(false)
		expect(hasFeature(snapshot, 'unknown')).toBe(false)
	})
	it('requires tasks for boards without a projects flag', () => {
		expect(hasFeature(snapshot, 'boards')).toBe(true)
		const disabled = {
			...snapshot,
			flags: snapshot.flags.map((flag) => ({
				...flag,
				enabled: flag.key !== FEATURE_KEYS.TASKS,
			})),
		}
		expect(hasFeature(disabled, 'tasks')).toBe(false)
		expect(hasFeature(disabled, 'boards')).toBe(false)
		expect(hasFeature(snapshot, 'tasks')).toBe(true)
	})
	it('matches exact keys and does not attach the next release flag to the old key', () => {
		const nextRelease = {
			version: 5,
			flags: [
				{
					key: 'boards-redesign-v3',
					enabled: true,
					updatedAt: '2026-10-10T00:00:00.000Z',
				},
			],
		}
		expect(hasFeature(nextRelease, 'boards-redesign-v2')).toBe(false)
		expect(hasFeature(nextRelease, 'boards-redesign-v3')).toBe(true)
	})
	it('never applies a debug fallback in production', () => {
		vi.stubEnv('NODE_ENV', 'production')
		vi.stubEnv('NEXT_PUBLIC_FEATURE_FLAGS_DEV_FALLBACK', 'true')
		expect(getDevelopmentSnapshot()).toBeUndefined()
	})
	it('requires an explicit development opt-in', () => {
		vi.stubEnv('NODE_ENV', 'development')
		vi.stubEnv('NEXT_PUBLIC_FEATURE_FLAGS_DEV_FALLBACK', '')
		expect(getDevelopmentSnapshot()).toBeUndefined()
		vi.stubEnv('NEXT_PUBLIC_FEATURE_FLAGS_DEV_FALLBACK', 'true')
		expect(getDevelopmentSnapshot()?.flags).toHaveLength(5)
		expect(hasFeature(getDevelopmentSnapshot(), FEATURE_KEYS.AI_ASSISTANT)).toBe(false)
		expect(hasFeature(getDevelopmentSnapshot(), FEATURE_KEYS.NOTIFICATIONS)).toBe(false)
		expect(hasFeature(getDevelopmentSnapshot(), FEATURE_KEYS.TASKS)).toBe(true)
	})
})
