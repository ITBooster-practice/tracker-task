import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'

import type { BoardColumn, CreateColumn, UpdateColumn } from '@repo/types'

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
		mutationFn: ({ teamId, projectId, boardId, data }) =>
			boardColumnsService.create(teamId, projectId, boardId, data),
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
		mutationFn: ({ teamId, projectId, boardId, columnId, data }) =>
			boardColumnsService.update(teamId, projectId, boardId, columnId, data),
		onSuccess: (_, variables) => refreshColumns(client, variables),
		onError: (error, variables) => {
			if (error.statusCode === 409 || error.statusCode === 404)
				void refreshColumns(client, variables)
		},
	})
}
