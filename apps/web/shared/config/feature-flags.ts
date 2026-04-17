export const FEATURES = {
	PROJECTS: process.env.NEXT_PUBLIC_FEATURE_PROJECTS === 'true',
	TASKS: process.env.NEXT_PUBLIC_FEATURE_TASKS === 'true',
	BOARDS: process.env.NEXT_PUBLIC_FEATURE_BOARDS === 'true',
	TEAM_SETTINGS: process.env.NEXT_PUBLIC_FEATURE_TEAM_SETTINGS === 'true',
} as const

export const getFeatureFlag = (featureName: keyof typeof FEATURES) => {
	return FEATURES[featureName] ?? false
}
