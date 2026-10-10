import { FEATURE_KEYS } from '@repo/types'

import { CreateTaskDialog } from '@/views/tasks'
import { FeatureGate } from '@/features/feature-flags'
import { requireServerFeature } from '@/shared/lib/feature-flags/server'

export default async function TaskNewModalPage() {
	await requireServerFeature(FEATURE_KEYS.TASKS)
	return (
		<FeatureGate feature={FEATURE_KEYS.TASKS}>
			<CreateTaskDialog />
		</FeatureGate>
	)
}
