import type { BoardListItem, CreateBoard } from '@repo/types'

import { client } from './client'

export const boardsService = {
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
