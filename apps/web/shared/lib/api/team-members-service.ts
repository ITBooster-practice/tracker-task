import type { ChangeRole, DeleteTeamResponse, TeamMember } from '@repo/types'

import { client } from './client'
import { normalizeTeamMember, type TeamMemberApiResponse } from './teams-normalizers'

export type { ChangeRole, DeleteTeamResponse, TeamMember }

const TEAMS_ENDPOINT = '/teams'
const buildTeamMembersEndpoint = (teamId: string) => `${TEAMS_ENDPOINT}/${teamId}/members`

export const teamMembersService = {
	getMembers: async (teamId: string): Promise<TeamMember[]> => {
		const response = await client.get<TeamMemberApiResponse[]>(
			buildTeamMembersEndpoint(teamId),
		)

		return response.data.map(normalizeTeamMember)
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
