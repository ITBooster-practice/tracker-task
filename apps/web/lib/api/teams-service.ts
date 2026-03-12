import type {
	CreateTeam,
	DeleteTeamResponse,
	Team,
	TeamListItem,
	UpdateTeam,
} from '@repo/types'

import { client } from './client'

export type { CreateTeam, DeleteTeamResponse, Team, TeamListItem, UpdateTeam }

const ENDPOINT = '/teams'
const CREATE_ENDPOINT = `${ENDPOINT}/new`

export const teamsService = {
	getAll: async (): Promise<TeamListItem[]> => {
		const response = await client.get<TeamListItem[]>(ENDPOINT)

		return response.data
	},

	getById: async (id: string): Promise<Team> => {
		const response = await client.get<Team>(`${ENDPOINT}/${id}`)

		return response.data
	},

	create: async (body: CreateTeam): Promise<Team> => {
		const response = await client.post<Team>(CREATE_ENDPOINT, body)

		return response.data
	},

	update: async (id: string, body: UpdateTeam): Promise<Team> => {
		const response = await client.patch<Team>(`${ENDPOINT}/${id}`, body)

		return response.data
	},

	delete: async (id: string): Promise<DeleteTeamResponse> => {
		const response = await client.delete<DeleteTeamResponse>(`${ENDPOINT}/${id}`)

		return response.data
	},
}
