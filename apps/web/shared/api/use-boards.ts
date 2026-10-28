import { useQuery } from '@tanstack/react-query'

import type { BoardListItem } from '@repo/types'

import { boardsService } from '@/shared/lib/api/boards-service'
import type { ApiError } from '@/shared/lib/api/types'

export const boardsKeys = {
	all: ['boards'] as const,
	lists: () => [...boardsKeys.all, 'list'] as const,
	list: (teamId: string, projectId: string) =>
		[...boardsKeys.lists(), teamId, projectId] as const,
}

export const useBoardsList = (teamId: string, projectId: string) =>
	useQuery<BoardListItem[], ApiError>({
		queryKey: boardsKeys.list(teamId, projectId),
		queryFn: ({ signal }) => boardsService.getAll(teamId, projectId, signal),
		enabled: Boolean(teamId) && Boolean(projectId),
	})
