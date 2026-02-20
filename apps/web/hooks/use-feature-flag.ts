import { FEATURES } from '../lib/feature-flags'

export const useFeatureFlag = (feature: keyof typeof FEATURES) => {
	return FEATURES[feature]
}
