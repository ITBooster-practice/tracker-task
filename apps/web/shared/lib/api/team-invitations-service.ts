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
const buildTeamInvitationsEndpoint = (teamId: string) =>
	`${TEAMS_ENDPOINT}/${teamId}/invitations`
const buildInvitationEndpoint = (token: string) => `${INVITATIONS_ENDPOINT}/${token}`

export const teamInvitationsService = {
	sendInvitation: async (
		teamId: string,
		body: SendInvitation,
	): Promise<TeamInvitation> => {
		const response = await client.post<TeamInvitationApiResponse>(
			buildTeamInvitationsEndpoint(teamId),
			body,
		)

		return normalizeTeamInvitation(response.data)
	},

	getTeamInvitations: async (teamId: string): Promise<TeamInvitation[]> => {
		const response = await client.get<TeamInvitationApiResponse[]>(
			buildTeamInvitationsEndpoint(teamId),
		)

		return response.data.map(normalizeTeamInvitation)
	},

	revokeInvitation: async (
		teamId: string,
		invitationId: string,
	): Promise<TeamInvitation> => {
		const response = await client.delete<TeamInvitationApiResponse>(
			`${buildTeamInvitationsEndpoint(teamId)}/${invitationId}`,
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
			`${buildInvitationEndpoint(token)}/accept`,
		)

		return normalizeTeam(response.data)
	},

	declineInvitation: async (token: string): Promise<TeamInvitation> => {
		const response = await client.post<TeamInvitationApiResponse>(
			`${buildInvitationEndpoint(token)}/decline`,
		)

		return normalizeTeamInvitation(response.data)
	},
}
