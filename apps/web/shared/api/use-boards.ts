import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ArchiveBoard, BoardListItem, CreateBoard, UpdateBoard } from '@repo/types'

import { boardsService } from '@/shared/lib/api/boards-service'
import type { ApiError } from '@/shared/lib/api/types'

import { boardsKeys } from './boards-keys'
import { taskLabelsKeys } from './use-task-labels'
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

export const useUpdateBoard = () => {
	const client = useQueryClient()
	return useMutation<
		BoardListItem,
		ApiError,
		{ teamId: string; projectId: string; boardId: string; data: UpdateBoard }
	>({
		mutationFn: ({ teamId, projectId, boardId, data }) =>
			boardsService.update(teamId, projectId, boardId, data),
		onSuccess: async (board, { teamId, projectId, boardId }) => {
			const listKey = boardsKeys.list(teamId, projectId)
			await client.cancelQueries({ queryKey: listKey, exact: true })
			client.setQueryData<BoardListItem[]>(listKey, (boards) =>
				boards?.map((item) => (item.id === board.id ? board : item)),
			)
			await Promise.all([
				client.invalidateQueries({ queryKey: listKey, exact: true }),
				client.invalidateQueries({
					queryKey: tasksKeys.board(teamId, projectId, boardId),
					exact: true,
				}),
				client.invalidateQueries({ queryKey: tasksKeys.projectLists(teamId, projectId) }),
				client.invalidateQueries({
					queryKey: tasksKeys.projectDetails(teamId, projectId),
				}),
			])
		},
	})
}

export const useArchiveBoard = (options?: {
	onArchived?: () => void | Promise<void>
}) => {
	const client = useQueryClient()
	return useMutation<
		void,
		ApiError,
		{ teamId: string; projectId: string; boardId: string; data: ArchiveBoard }
	>({
		mutationFn: ({ teamId, projectId, boardId, data }) =>
			boardsService.archive(teamId, projectId, boardId, data),
		onSuccess: async (_, { teamId, projectId, boardId }) => {
			// Удаление активной доски из кэша может размонтировать вызывающий компонент.
			await options?.onArchived?.()
			const listKey = boardsKeys.list(teamId, projectId)
			const boardKey = tasksKeys.board(teamId, projectId, boardId)
			const detailKey = tasksKeys.projectDetails(teamId, projectId)
			const refreshKeys = [
				listKey,
				tasksKeys.projectLists(teamId, projectId),
				tasksKeys.projectBoards(teamId, projectId),
				taskLabelsKeys.project(teamId, projectId),
			]
			await Promise.all(
				[...refreshKeys, detailKey].map((queryKey) => client.cancelQueries({ queryKey })),
			)
			client.setQueryData<BoardListItem[]>(listKey, (boards) =>
				boards?.filter((board) => board.id !== boardId),
			)
			client.removeQueries({ queryKey: boardKey, exact: true })
			client.removeQueries({ queryKey: detailKey })
			await Promise.all(
				refreshKeys.map((queryKey) => client.invalidateQueries({ queryKey })),
			)
		},
	})
}
