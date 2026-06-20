import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query'

import type {
	CreateTask,
	PaginatedResponse,
	Task,
	TaskFilterParams,
	UpdateTask,
} from '@repo/types'

import { tasksService } from '@/shared/lib/api/tasks-service'
import type { ApiError } from '@/shared/lib/api/types'

export const tasksKeys = {
	all: ['tasks'] as const,
	lists: () => [...tasksKeys.all, 'list'] as const,
	projectLists: (teamId: string, projectId: string) =>
		[...tasksKeys.lists(), teamId, projectId] as const,
	list: (teamId: string, projectId: string, params?: TaskFilterParams) =>
		[...tasksKeys.projectLists(teamId, projectId), params] as const,
	details: () => [...tasksKeys.all, 'detail'] as const,
	detail: (teamId: string, projectId: string, taskId: string) =>
		[...tasksKeys.details(), teamId, projectId, taskId] as const,
} as const

export const useTasksList = (
	teamId: string,
	projectId: string,
	params?: TaskFilterParams,
) => {
	return useQuery<PaginatedResponse<Task>>({
		queryKey: tasksKeys.list(teamId, projectId, params),
		queryFn: () => tasksService.getAll(teamId, projectId, params),
		enabled: Boolean(teamId) && Boolean(projectId),
		placeholderData: keepPreviousData,
	})
}

export const useTaskDetail = (teamId: string, projectId: string, taskId: string) => {
	return useQuery<Task>({
		queryKey: tasksKeys.detail(teamId, projectId, taskId),
		queryFn: () => tasksService.getById(teamId, projectId, taskId),
		enabled: Boolean(teamId) && Boolean(projectId) && Boolean(taskId),
	})
}

export const useCreateTask = () => {
	const queryClient = useQueryClient()

	return useMutation<
		Task,
		ApiError,
		{ teamId: string; projectId: string; data: CreateTask }
	>({
		mutationFn: ({ teamId, projectId, data }) =>
			tasksService.create(teamId, projectId, data),
		onSuccess: (task, { teamId, projectId }) => {
			queryClient.setQueryData(tasksKeys.detail(teamId, projectId, task.id), task)
			queryClient.invalidateQueries({
				queryKey: tasksKeys.projectLists(teamId, projectId),
			})
		},
	})
}

export const useUpdateTask = () => {
	const queryClient = useQueryClient()

	return useMutation<
		Task,
		ApiError,
		{ teamId: string; projectId: string; taskId: string; data: UpdateTask }
	>({
		mutationFn: ({ teamId, projectId, taskId, data }) =>
			tasksService.update(teamId, projectId, taskId, data),
		onSuccess: (task, { teamId, projectId, taskId }) => {
			queryClient.setQueryData(tasksKeys.detail(teamId, projectId, taskId), task)
			queryClient.invalidateQueries({
				queryKey: tasksKeys.projectLists(teamId, projectId),
			})
		},
	})
}

export const useDeleteTask = () => {
	const queryClient = useQueryClient()

	return useMutation<
		void,
		ApiError,
		{ teamId: string; projectId: string; taskId: string }
	>({
		mutationFn: ({ teamId, projectId, taskId }) =>
			tasksService.delete(teamId, projectId, taskId),
		onSuccess: (_, { teamId, projectId, taskId }) => {
			queryClient.invalidateQueries({
				queryKey: tasksKeys.projectLists(teamId, projectId),
			})
			queryClient.removeQueries({
				queryKey: tasksKeys.detail(teamId, projectId, taskId),
			})
		},
	})
}
