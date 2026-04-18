import type {
	CreateTeam,
	DeleteTeamResponse,
	PaginatedResponse,
	PaginationParams,
	Team,
	TeamListItem,
	UpdateTeam,
} from '@repo/types'

import { client } from './client'
import { normalizeTeam, type TeamApiResponse } from './teams-normalizers'

export type { CreateTeam, DeleteTeamResponse, Team, TeamListItem, UpdateTeam }

const TEAMS_ENDPOINT = '/teams'
const TEAM_CREATE_ENDPOINT = `${TEAMS_ENDPOINT}/new`
const buildTeamEndpoint = (teamId: string) => `${TEAMS_ENDPOINT}/${teamId}`

export const teamsService = {
	getAll: async (params?: PaginationParams): Promise<PaginatedResponse<TeamListItem>> => {
		const response = await client.get<PaginatedResponse<TeamListItem>>(TEAMS_ENDPOINT, {
			params,
		})

		return response.data
	},

	getById: async (teamId: string): Promise<Team> => {
		const response = await client.get<TeamApiResponse>(buildTeamEndpoint(teamId))

		return normalizeTeam(response.data)
	},

	create: async (body: CreateTeam): Promise<Team> => {
		const response = await client.post<TeamApiResponse>(TEAM_CREATE_ENDPOINT, body)

		return normalizeTeam(response.data)
	},

	update: async (teamId: string, body: UpdateTeam): Promise<Team> => {
		const response = await client.patch<TeamApiResponse>(buildTeamEndpoint(teamId), body)

		return normalizeTeam(response.data)
	},

	delete: async (teamId: string): Promise<DeleteTeamResponse> => {
		const response = await client.delete<DeleteTeamResponse>(buildTeamEndpoint(teamId))

		return response.data
	},
}
