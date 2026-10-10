import { FEATURE_KEYS, type FeatureFlagsSnapshot } from '@repo/types'

export function hasFeature(
	snapshot: FeatureFlagsSnapshot | null | undefined,
	key: string,
): boolean {
	const enabled = (name: string) =>
		snapshot?.flags.some((flag) => flag.key === name && flag.enabled) ?? false
	if (!enabled(key)) return false
	if (key === FEATURE_KEYS.TASKS) return enabled(FEATURE_KEYS.PROJECTS)
	if (key === FEATURE_KEYS.BOARDS)
		return enabled(FEATURE_KEYS.PROJECTS) && enabled(FEATURE_KEYS.TASKS)
	return true
}

// Явное включение локального режима разрешено только при разработке.
export function getDevelopmentSnapshot(): FeatureFlagsSnapshot | undefined {
	if (
		process.env.NODE_ENV !== 'development' ||
		process.env.NEXT_PUBLIC_FEATURE_FLAGS_DEV_FALLBACK !== 'true'
	)
		return undefined
	return {
		version: 0,
		flags: Object.values(FEATURE_KEYS).map((key) => ({
			key,
			enabled: true,
			updatedAt: '1970-01-01T00:00:00.000Z',
		})),
	}
}
