import type {
	CreateTeam,
	DeleteTeamResponse,
	Team,
	TeamListItem,
	TeamMember,
	UpdateTeam,
} from '@repo/types'

import { client } from './client'

export type { CreateTeam, DeleteTeamResponse, Team, TeamListItem, UpdateTeam }

const ENDPOINT = '/teams'
const CREATE_ENDPOINT = `${ENDPOINT}/new`

type TeamApiMember = Partial<TeamMember> & {
	user?: {
		id?: string
		name?: string | null
		email?: string
	} | null
}

type TeamApiResponse = Omit<Team, 'members'> & {
	members: TeamApiMember[]
}

function normalizeTeamMember(member: TeamApiMember): TeamMember {
	return {
		id: member.id ?? member.userId ?? member.user?.id ?? '',
		userId: member.userId ?? member.user?.id ?? '',
		name: member.name ?? member.user?.name ?? null,
		email: member.email ?? member.user?.email ?? '',
		role: member.role ?? 'MEMBER',
		joinedAt: member.joinedAt ?? '',
	}
}

function normalizeTeam(team: TeamApiResponse): Team {
	return {
		...team,
		members: Array.isArray(team.members) ? team.members.map(normalizeTeamMember) : [],
	}
}

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
