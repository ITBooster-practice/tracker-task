import type { ChangeRole, DeleteTeamResponse, TeamMember } from '@repo/types'

import { client } from './client'
import { normalizeTeamMember, type TeamApiMember } from './teams-normalizers'

export type { ChangeRole, DeleteTeamResponse, TeamMember }

const ENDPOINT = '/teams'

type TeamMemberApiResponse = TeamApiMember & {
	teamId?: string
}

export const teamMembersService = {
	getMembers: async (teamId: string): Promise<TeamMember[]> => {
		const response = await client.get<TeamMemberApiResponse[]>(
			`${ENDPOINT}/${teamId}/members`,
		)

		return response.data.map(normalizeTeamMember)
	},

	changeRole: async (
		teamId: string,
		userId: string,
		body: ChangeRole,
	): Promise<TeamMember> => {
		const response = await client.patch<TeamMemberApiResponse>(
			`${ENDPOINT}/${teamId}/members/${userId}/role`,
			body,
		)

		return normalizeTeamMember(response.data)
	},

	removeMember: async (teamId: string, userId: string): Promise<DeleteTeamResponse> => {
		const response = await client.delete<DeleteTeamResponse>(
			`${ENDPOINT}/${teamId}/members/${userId}`,
		)

		return response.data
	},
}
