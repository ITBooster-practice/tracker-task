import { FEATURES, isFeatureEnabled } from '../lib/feature-flags'

export const useFeatureFlag = (feature: keyof typeof FEATURES) => {
	return isFeatureEnabled(feature)
}
