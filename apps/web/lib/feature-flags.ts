import { createFeatureFlagChecker } from '@repo/shared/feature-flags'

export const FEATURES = {
	AUTH: process.env.NEXT_PUBLIC_FEATURE_AUTH === 'true',
	PROJECTS: process.env.NEXT_PUBLIC_FEATURE_PROJECTS === 'true',
	TASKS: process.env.NEXT_PUBLIC_FEATURE_TASKS === 'true',
	SPRINTS: process.env.NEXT_PUBLIC_FEATURE_SPRINTS === 'true',
} as const

export const isFeatureEnabled = createFeatureFlagChecker(FEATURES)
