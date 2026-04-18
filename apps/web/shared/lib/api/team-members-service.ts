import type {
	ChangeRole,
	DeleteTeamResponse,
	PaginatedResponse,
	PaginationParams,
	TeamMember,
} from '@repo/types'

import { client } from './client'
import { normalizeTeamMember, type TeamMemberApiResponse } from './teams-normalizers'

export type { ChangeRole, DeleteTeamResponse, TeamMember }

const TEAMS_ENDPOINT = '/teams'
const buildTeamMembersEndpoint = (teamId: string) => `${TEAMS_ENDPOINT}/${teamId}/members`

export const teamMembersService = {
	getMembers: async (
		teamId: string,
		params?: PaginationParams,
	): Promise<PaginatedResponse<TeamMember>> => {
		const response = await client.get<{
			data: TeamMemberApiResponse[]
			meta: PaginatedResponse<TeamMember>['meta']
		}>(buildTeamMembersEndpoint(teamId), { params })

		return {
			data: response.data.data.map(normalizeTeamMember),
			meta: response.data.meta,
		}
	},

	changeRole: async (
		teamId: string,
		userId: string,
		body: ChangeRole,
	): Promise<TeamMember> => {
		const response = await client.patch<TeamMemberApiResponse>(
			`${buildTeamMembersEndpoint(teamId)}/${userId}/role`,
			body,
		)

		return normalizeTeamMember(response.data)
	},

	removeMember: async (teamId: string, userId: string): Promise<DeleteTeamResponse> => {
		const response = await client.delete<DeleteTeamResponse>(
			`${buildTeamMembersEndpoint(teamId)}/${userId}`,
		)

		return response.data
	},
}
