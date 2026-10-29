import type { BoardColumn, CreateColumn, UpdateColumn } from '@repo/types'

import { client } from './client'

const columnsPath = (teamId: string, projectId: string, boardId: string) =>
	`/teams/${teamId}/projects/${projectId}/boards/${boardId}/columns`

export const boardColumnsService = {
	create: async (
		teamId: string,
		projectId: string,
		boardId: string,
		data: CreateColumn,
	): Promise<BoardColumn> => {
		const response = await client.post<BoardColumn>(
			columnsPath(teamId, projectId, boardId),
			data,
		)
		return response.data
	},
	update: async (
		teamId: string,
		projectId: string,
		boardId: string,
		columnId: string,
		data: UpdateColumn,
	): Promise<BoardColumn> => {
		const response = await client.patch<BoardColumn>(
			`${columnsPath(teamId, projectId, boardId)}/${columnId}`,
			data,
		)
		return response.data
	},
}
