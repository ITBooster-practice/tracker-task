import { useQuery } from '@tanstack/react-query'

import { taskLabelKey } from '@repo/types'

import { tasksService } from '@/shared/lib/api/tasks-service'
import type { ApiError } from '@/shared/lib/api/types'

export const taskLabelsKeys = {
	project: (teamId: string, projectId: string) =>
		['task-labels', teamId, projectId] as const,
	list: (teamId: string, projectId: string, search: string) =>
		[...taskLabelsKeys.project(teamId, projectId), taskLabelKey(search)] as const,
}

export function useTaskLabels(teamId: string, projectId: string, search: string) {
	const query = taskLabelKey(search)
	return useQuery<string[], ApiError>({
		queryKey: taskLabelsKeys.list(teamId, projectId, query),
		queryFn: ({ signal }) => tasksService.getLabels(teamId, projectId, query, signal),
		enabled: Boolean(teamId && projectId),
		staleTime: 30_000,
	})
}
