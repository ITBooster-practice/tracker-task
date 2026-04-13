import type {
	CreateTeam,
	DeleteTeamResponse,
	Team,
	TeamListItem,
	UpdateTeam,
} from '@repo/types'

import { client } from './client'
import { normalizeTeam, type TeamApiResponse } from './teams-normalizers'

export type { CreateTeam, DeleteTeamResponse, Team, TeamListItem, UpdateTeam }

const ENDPOINT = '/teams'
const CREATE_ENDPOINT = `${ENDPOINT}/new`

export const teamsService = {
	getAll: async (): Promise<TeamListItem[]> => {
		const response = await client.get<TeamListItem[]>(ENDPOINT)

		return response.data
	},

	getById: async (id: string): Promise<Team> => {
		const response = await client.get<TeamApiResponse>(`${ENDPOINT}/${id}`)

		return normalizeTeam(response.data)
	},

	create: async (body: CreateTeam): Promise<Team> => {
		const response = await client.post<TeamApiResponse>(CREATE_ENDPOINT, body)

		return normalizeTeam(response.data)
	},

	update: async (id: string, body: UpdateTeam): Promise<Team> => {
		const response = await client.patch<TeamApiResponse>(`${ENDPOINT}/${id}`, body)

		return normalizeTeam(response.data)
	},

	delete: async (id: string): Promise<DeleteTeamResponse> => {
		const response = await client.delete<DeleteTeamResponse>(`${ENDPOINT}/${id}`)

		return response.data
	},
}
