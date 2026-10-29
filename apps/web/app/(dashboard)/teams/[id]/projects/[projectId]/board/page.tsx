import { FEATURE_KEYS } from '@repo/types'

import { ProjectBoardPageView } from '@/views/boards'
import { FeatureGate } from '@/features/feature-flags'
import { requireServerFeature } from '@/shared/lib/feature-flags/server'

export default async function ProjectBoardPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string; projectId: string }>
	searchParams?: Promise<{ boardId?: string | string[] }>
}) {
	await requireServerFeature(FEATURE_KEYS.BOARDS)
	const { id, projectId } = await params
	const query = await searchParams
	const boardId =
		query?.boardId === undefined
			? undefined
			: typeof query.boardId === 'string'
				? query.boardId
				: ''
	return (
		<FeatureGate feature={FEATURE_KEYS.BOARDS}>
			<ProjectBoardPageView teamId={id} projectId={projectId} boardId={boardId} />
		</FeatureGate>
	)
}
