export const FEATURES = {
	AUTH: process.env.NEXT_PUBLIC_FEATURE_AUTH === 'true',
	AUTH_DISABLE: process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true',
	PROJECTS: process.env.NEXT_PUBLIC_FEATURE_PROJECTS === 'true',
	TASKS: process.env.NEXT_PUBLIC_FEATURE_TASKS === 'true',
	SPRINTS: process.env.NEXT_PUBLIC_FEATURE_SPRINTS === 'true',
} as const

export const useFeatureFlag = (featureName: keyof typeof FEATURES) => {
	return FEATURES[featureName] ?? false
}
