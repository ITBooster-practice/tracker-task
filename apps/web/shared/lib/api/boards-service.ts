import type { BoardListItem } from '@repo/types'

import { client } from './client'

export const boardsService = {
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
