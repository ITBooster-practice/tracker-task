import { FEATURE_KEYS } from '@repo/types'

import { FeatureGate } from '@/features/feature-flags'
import { requireServerFeature } from '@/shared/lib/feature-flags/server'

export default async function ProjectsLayout({
	children,
}: {
	children: React.ReactNode
}) {
	await requireServerFeature(FEATURE_KEYS.PROJECTS)
	return <FeatureGate feature={FEATURE_KEYS.PROJECTS}>{children}</FeatureGate>
}
