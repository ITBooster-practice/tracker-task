import type {
	BoardColumn,
	CreateColumn,
	DeleteColumn,
	ReorderColumns,
	UpdateColumn,
} from '@repo/types'

import { client } from './client'

const columnsPath = (boardId: string) => `/boards/${boardId}/columns`

export const boardColumnsService = {
	create: async (boardId: string, data: CreateColumn): Promise<BoardColumn> => {
		const response = await client.post<BoardColumn>(columnsPath(boardId), data)
		return response.data
	},
	update: async (
		boardId: string,
		columnId: string,
		data: UpdateColumn,
	): Promise<BoardColumn> => {
		const response = await client.patch<BoardColumn>(
			`${columnsPath(boardId)}/${columnId}`,
			data,
		)
		return response.data
	},
	delete: async (
		boardId: string,
		columnId: string,
		data: DeleteColumn,
	): Promise<void> => {
		await client.delete(`${columnsPath(boardId)}/${columnId}`, { data })
	},
	reorder: async (boardId: string, data: ReorderColumns): Promise<BoardColumn[]> => {
		const response = await client.patch<BoardColumn[]>(
			`${columnsPath(boardId)}/reorder`,
			data,
		)
		return response.data
	},
}
