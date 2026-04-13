import type { MyInvitation, SendInvitation, Team, TeamInvitation } from '@repo/types'

import { client } from './client'
import {
	normalizeMyInvitation,
	normalizeTeam,
	normalizeTeamInvitation,
	type MyInvitationApiResponse,
	type TeamApiResponse,
	type TeamInvitationApiResponse,
} from './teams-normalizers'

export type { MyInvitation, SendInvitation, Team, TeamInvitation }

const TEAMS_ENDPOINT = '/teams'
const INVITATIONS_ENDPOINT = '/invitations'

export const teamInvitationsService = {
	sendInvitation: async (
		teamId: string,
		body: SendInvitation,
	): Promise<TeamInvitation> => {
		const response = await client.post<TeamInvitationApiResponse>(
			`${TEAMS_ENDPOINT}/${teamId}/invitations`,
			body,
		)

		return normalizeTeamInvitation(response.data)
	},

	getTeamInvitations: async (teamId: string): Promise<TeamInvitation[]> => {
		const response = await client.get<TeamInvitationApiResponse[]>(
			`${TEAMS_ENDPOINT}/${teamId}/invitations`,
		)

		return response.data.map(normalizeTeamInvitation)
	},

	revokeInvitation: async (
		teamId: string,
		invitationId: string,
	): Promise<TeamInvitation> => {
		const response = await client.delete<TeamInvitationApiResponse>(
			`${TEAMS_ENDPOINT}/${teamId}/invitations/${invitationId}`,
		)

		return normalizeTeamInvitation(response.data)
	},

	getMyInvitations: async (): Promise<MyInvitation[]> => {
		const response = await client.get<MyInvitationApiResponse[]>(
			`${INVITATIONS_ENDPOINT}/me`,
		)

		return response.data.map(normalizeMyInvitation)
	},

	acceptInvitation: async (token: string): Promise<Team> => {
		const response = await client.post<TeamApiResponse>(
			`${INVITATIONS_ENDPOINT}/${token}/accept`,
		)

		return normalizeTeam(response.data)
	},

	declineInvitation: async (token: string): Promise<TeamInvitation> => {
		const response = await client.post<TeamInvitationApiResponse>(
			`${INVITATIONS_ENDPOINT}/${token}/decline`,
		)

		return normalizeTeamInvitation(response.data)
	},
}
