import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'

import type {
	BoardColumn,
	CreateColumn,
	DeleteColumn,
	ReorderColumns,
	UpdateColumn,
} from '@repo/types'

import { boardColumnsService } from '@/shared/lib/api/board-columns-service'
import type { ApiError } from '@/shared/lib/api/types'

import { boardsKeys } from './boards-keys'
import { tasksKeys } from './use-tasks'

interface ColumnContext {
	teamId: string
	projectId: string
	boardId: string
}

const refreshColumns = async (
	client: QueryClient,
	{ teamId, projectId, boardId }: ColumnContext,
) => {
	const keys = [
		tasksKeys.board(teamId, projectId, boardId),
		boardsKeys.list(teamId, projectId),
	]
	await Promise.all(
		keys.map((queryKey) => client.cancelQueries({ queryKey, exact: true })),
	)
	await Promise.all(
		keys.map((queryKey) => client.invalidateQueries({ queryKey, exact: true })),
	)
}

export const useCreateBoardColumn = () => {
	const client = useQueryClient()
	return useMutation<BoardColumn, ApiError, ColumnContext & { data: CreateColumn }>({
		mutationFn: ({ boardId, data }) => boardColumnsService.create(boardId, data),
		onSuccess: (_, variables) => refreshColumns(client, variables),
		onError: (error, variables) => {
			if (error.statusCode === 409 || error.statusCode === 404)
				void refreshColumns(client, variables)
		},
	})
}

export const useUpdateBoardColumn = () => {
	const client = useQueryClient()
	return useMutation<
		BoardColumn,
		ApiError,
		ColumnContext & { columnId: string; data: UpdateColumn }
	>({
		mutationFn: ({ boardId, columnId, data }) =>
			boardColumnsService.update(boardId, columnId, data),
		onSuccess: (_, variables) => refreshColumns(client, variables),
		onError: (error, variables) => {
			if (error.statusCode === 409 || error.statusCode === 404)
				void refreshColumns(client, variables)
		},
	})
}

// Deletion moves tasks and can change their status and version.
const refreshDeletedColumn = async (
	client: QueryClient,
	{ teamId, projectId }: ColumnContext,
) => {
	const keys = [
		boardsKeys.list(teamId, projectId),
		tasksKeys.projectBoards(teamId, projectId),
		tasksKeys.projectLists(teamId, projectId),
		tasksKeys.projectDetails(teamId, projectId),
	]
	await Promise.all(keys.map((queryKey) => client.cancelQueries({ queryKey })))
	await Promise.all(keys.map((queryKey) => client.invalidateQueries({ queryKey })))
}

export const useDeleteBoardColumn = () => {
	const client = useQueryClient()
	return useMutation<
		void,
		ApiError,
		ColumnContext & { columnId: string; data: DeleteColumn }
	>({
		retry: false,
		mutationFn: ({ boardId, columnId, data }) =>
			boardColumnsService.delete(boardId, columnId, data),
		onSuccess: (_, variables) => refreshDeletedColumn(client, variables),
		onError: (error, variables) => {
			if ([400, 404, 409].includes(error.statusCode))
				void refreshDeletedColumn(client, variables)
		},
	})
}

export const useReorderBoardColumns = () => {
	const client = useQueryClient()
	return useMutation<BoardColumn[], ApiError, ColumnContext & { data: ReorderColumns }>({
		retry: false,
		mutationFn: ({ boardId, data }) => boardColumnsService.reorder(boardId, data),
		onSuccess: (_, variables) => refreshColumns(client, variables),
		onError: (error, variables) => {
			if ([400, 404, 409].includes(error.statusCode))
				void refreshColumns(client, variables)
		},
	})
}
