import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
	type QueryClient,
} from '@tanstack/react-query'

import type {
	BoardTask,
	BoardView,
	CreateTask,
	MoveTaskToColumn,
	PaginatedResponse,
	Task,
	TaskFilterParams,
	TaskMoveConflict,
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
	projectDetails: (teamId: string, projectId: string) =>
		[...tasksKeys.details(), teamId, projectId] as const,
	detail: (teamId: string, projectId: string, taskId: string) =>
		[...tasksKeys.projectDetails(teamId, projectId), taskId] as const,
	boards: () => [...tasksKeys.all, 'board'] as const,
	projectBoards: (teamId: string, projectId: string) =>
		[...tasksKeys.boards(), teamId, projectId] as const,
	board: (teamId: string, projectId: string, boardId: string) =>
		[...tasksKeys.projectBoards(teamId, projectId), boardId] as const,
} as const

const refreshProjectTasks = async (
	queryClient: QueryClient,
	teamId: string,
	projectId: string,
) => {
	const keys = [
		tasksKeys.projectLists(teamId, projectId),
		tasksKeys.projectBoards(teamId, projectId),
		tasksKeys.projectDetails(teamId, projectId),
	]
	await Promise.all(keys.map((queryKey) => queryClient.cancelQueries({ queryKey })))
	await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })))
}

export const useBoardQuery = (teamId: string, projectId: string, boardId: string) => {
	return useQuery<BoardView, ApiError>({
		queryKey: tasksKeys.board(teamId, projectId, boardId),
		queryFn: ({ signal }) => tasksService.getBoard(teamId, projectId, boardId, signal),
		enabled: Boolean(teamId) && Boolean(projectId) && Boolean(boardId),
	})
}

export const useMoveTask = () => {
	const queryClient = useQueryClient()
	return useMutation<
		BoardTask,
		ApiError | TaskMoveConflict,
		{ teamId: string; projectId: string; taskId: string; body: MoveTaskToColumn }
	>({
		mutationFn: ({ teamId, projectId, taskId, body }) =>
			tasksService.move(teamId, projectId, taskId, body),
		retry: false,
		onSettled: (_, _error, { teamId, projectId }) =>
			refreshProjectTasks(queryClient, teamId, projectId),
	})
}

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
		onSuccess: (_, { teamId, projectId }) =>
			refreshProjectTasks(queryClient, teamId, projectId),
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
		onSuccess: (_, { teamId, projectId }) =>
			refreshProjectTasks(queryClient, teamId, projectId),
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
		onSuccess: async (_, { teamId, projectId, taskId }) => {
			queryClient.removeQueries({
				queryKey: tasksKeys.detail(teamId, projectId, taskId),
				exact: true,
			})
			await refreshProjectTasks(queryClient, teamId, projectId)
		},
	})
}
