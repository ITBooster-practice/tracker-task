import type { ArchiveBoard, BoardListItem, CreateBoard, UpdateBoard } from '@repo/types'

import { client } from './client'

export const boardsService = {
	archive: async (
		teamId: string,
		projectId: string,
		boardId: string,
		data: ArchiveBoard,
	): Promise<void> => {
		await client.post(
			`/teams/${teamId}/projects/${projectId}/boards/${boardId}/archive`,
			data,
		)
	},
	update: async (
		teamId: string,
		projectId: string,
		boardId: string,
		data: UpdateBoard,
	): Promise<BoardListItem> => {
		const response = await client.patch<BoardListItem>(
			`/teams/${teamId}/projects/${projectId}/boards/${boardId}`,
			data,
		)
		return response.data
	},
	create: async (
		teamId: string,
		projectId: string,
		data: CreateBoard,
	): Promise<BoardListItem> => {
		const response = await client.post<BoardListItem>(
			`/teams/${teamId}/projects/${projectId}/boards`,
			data,
		)
		return response.data
	},
	delete: async (teamId: string, projectId: string, boardId: string): Promise<void> => {
		await client.delete(`/teams/${teamId}/projects/${projectId}/boards/${boardId}`)
	},
	getAll: async (
		teamId: string,
		projectId: string,
		signal?: AbortSignal,
	): Promise<BoardListItem[]> => {
		const response = await client.get<BoardListItem[]>(
			`/teams/${teamId}/projects/${projectId}/boards`,
			{ signal },
		)
		return response.data
	},
}
