import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'

import { FEATURE_KEYS } from '@repo/types'

import { ProjectBoardPageView } from '@/views/boards'
import { FeatureGate } from '@/features/feature-flags'
import { boardsKeys } from '@/shared/api/boards-keys'
import { boardsService } from '@/shared/lib/api/boards-service'
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
	const queryClient = new QueryClient()
	await queryClient.prefetchQuery({
		queryKey: boardsKeys.list(id, projectId),
		queryFn: ({ signal }) => boardsService.getAll(id, projectId, signal),
		retry: false,
	})
	const query = await searchParams
	const boardId =
		query?.boardId === undefined
			? undefined
			: typeof query.boardId === 'string'
				? query.boardId
				: ''
	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<FeatureGate feature={FEATURE_KEYS.BOARDS}>
				<ProjectBoardPageView teamId={id} projectId={projectId} boardId={boardId} />
			</FeatureGate>
		</HydrationBoundary>
	)
}
