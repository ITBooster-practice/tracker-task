import { createFeatureFlagChecker } from '@repo/shared/feature-flags'

export const FEATURES = {
	AUTH: process.env.ENABLE_AUTH === 'true',
	WEBHOOKS: process.env.ENABLE_WEBHOOKS === 'true',
} as const

export const isFeatureEnabled = createFeatureFlagChecker(FEATURES)
