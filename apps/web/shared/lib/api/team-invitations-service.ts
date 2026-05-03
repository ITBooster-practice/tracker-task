import type {
	MyInvitation,
	PaginatedResponse,
	PaginationParams,
	SendInvitation,
	Team,
	TeamInvitation,
} from '@repo/types'

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

	getTeamInvitations: async (
		teamId: string,
		params?: PaginationParams,
	): Promise<PaginatedResponse<TeamInvitation>> => {
		const response = await client.get<{
			data: TeamInvitationApiResponse[]
			meta: PaginatedResponse<TeamInvitation>['meta']
		}>(buildTeamInvitationsEndpoint(teamId), { params })

		return {
			data: response.data.data.map(normalizeTeamInvitation),
			meta: response.data.meta,
		}
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
		const response = await client.get<{
			data: MyInvitationApiResponse[]
			meta: unknown
		}>(`${INVITATIONS_ENDPOINT}/me`)

		return response.data.data.map(normalizeMyInvitation)
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
