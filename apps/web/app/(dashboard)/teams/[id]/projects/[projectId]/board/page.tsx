import { FEATURE_KEYS } from '@repo/types'

import { ProjectBoardPageView } from '@/views/boards'
import { FeatureGate } from '@/features/feature-flags'
import { requireServerFeature } from '@/shared/lib/feature-flags/server'

export default async function ProjectBoardPage({
	params,
}: {
	params: Promise<{ id: string; projectId: string }>
}) {
	await requireServerFeature(FEATURE_KEYS.BOARDS)
	const { id, projectId } = await params
	return (
		<FeatureGate feature={FEATURE_KEYS.BOARDS}>
			<ProjectBoardPageView teamId={id} projectId={projectId} />
		</FeatureGate>
	)
}
