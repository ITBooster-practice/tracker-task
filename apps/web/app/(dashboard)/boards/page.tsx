import { FEATURE_KEYS } from '@repo/types'

import { BoardsPageView } from '@/views/boards'
import { FeatureGate } from '@/features/feature-flags'
import { requireServerFeature } from '@/shared/lib/feature-flags/server'

export default async function BoardsPage() {
	await requireServerFeature(FEATURE_KEYS.BOARDS)
	return (
		<FeatureGate feature={FEATURE_KEYS.BOARDS}>
			<BoardsPageView />
		</FeatureGate>
	)
}
