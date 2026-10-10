import { FEATURE_KEYS } from '@repo/types'

import { TeamSettingsPageView } from '@/views/teams'
import { FeatureGate } from '@/features/feature-flags'
import { requireServerFeature } from '@/shared/lib/feature-flags/server'

export default async function TeamSettingsPage() {
	await requireServerFeature(FEATURE_KEYS.TEAM_SETTINGS)
	return (
		<FeatureGate feature={FEATURE_KEYS.TEAM_SETTINGS}>
			<TeamSettingsPageView />
		</FeatureGate>
	)
}
