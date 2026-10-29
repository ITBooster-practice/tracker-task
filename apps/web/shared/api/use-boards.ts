import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { BoardListItem, CreateBoard } from '@repo/types'

import { boardsService } from '@/shared/lib/api/boards-service'
import type { ApiError } from '@/shared/lib/api/types'

import { boardsKeys } from './boards-keys'
import { tasksKeys } from './use-tasks'

export { boardsKeys } from './boards-keys'

export const useBoardsList = (teamId: string, projectId: string) =>
	useQuery<BoardListItem[], ApiError>({
		queryKey: boardsKeys.list(teamId, projectId),
		queryFn: ({ signal }) => boardsService.getAll(teamId, projectId, signal),
		enabled: Boolean(teamId) && Boolean(projectId),
	})

export const useCreateBoard = () => {
	const client = useQueryClient()
	return useMutation<
		BoardListItem,
		ApiError,
		{ teamId: string; projectId: string; data: CreateBoard }
	>({
		mutationFn: ({ teamId, projectId, data }) =>
			boardsService.create(teamId, projectId, data),
		onSuccess: async (board, { teamId, projectId }) => {
			const queryKey = boardsKeys.list(teamId, projectId)
			await client.cancelQueries({ queryKey, exact: true })
			client.setQueryData<BoardListItem[]>(
				queryKey,
				(boards) => boards && [...boards.filter((item) => item.id !== board.id), board],
			)
			await client.invalidateQueries({ queryKey, exact: true })
		},
	})
}

export const useDeleteBoard = () => {
	const client = useQueryClient()
	return useMutation<
		void,
		ApiError,
		{ teamId: string; projectId: string; boardId: string }
	>({
		mutationFn: ({ teamId, projectId, boardId }) =>
			boardsService.delete(teamId, projectId, boardId),
		onSuccess: async (_, { teamId, projectId, boardId }) => {
			const queryKey = boardsKeys.list(teamId, projectId)
			const boardKey = tasksKeys.board(teamId, projectId, boardId)
			await Promise.all([
				client.cancelQueries({ queryKey, exact: true }),
				client.cancelQueries({ queryKey: boardKey, exact: true }),
			])
			client.setQueryData<BoardListItem[]>(queryKey, (boards) =>
				boards?.filter((board) => board.id !== boardId),
			)
			client.removeQueries({ queryKey: boardKey, exact: true })
			await client.invalidateQueries({ queryKey, exact: true })
		},
	})
}
