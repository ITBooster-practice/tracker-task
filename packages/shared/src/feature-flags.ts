export function createFeatureFlagChecker<T extends Record<string, boolean>>(features: T) {
	return function isFeatureEnabled(featureName: keyof T): boolean {
		return features[featureName] ?? false
	}
}
