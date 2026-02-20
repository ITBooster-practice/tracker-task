export const FEATURES = {
	AUTH: process.env.NEXT_PUBLIC_FEATURE_AUTH === 'true',
} as const

export const useFeatureFlag = (featureName: keyof typeof FEATURES) => {
	return FEATURES[featureName] ?? false
}
