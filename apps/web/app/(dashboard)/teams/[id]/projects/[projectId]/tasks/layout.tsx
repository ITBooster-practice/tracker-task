import { FEATURE_KEYS } from '@repo/types'

import { FeatureGate } from '@/features/feature-flags'
import { requireServerFeature } from '@/shared/lib/feature-flags/server'

export default async function TasksLayout({ children }: { children: React.ReactNode }) {
	await requireServerFeature(FEATURE_KEYS.TASKS)
	return <FeatureGate feature={FEATURE_KEYS.TASKS}>{children}</FeatureGate>
}
