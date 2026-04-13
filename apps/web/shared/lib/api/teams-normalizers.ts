import type {
	InvitationInvitedBy,
	InvitationTeamSummary,
	MyInvitation,
	Team,
	TeamInvitation,
	TeamMember,
} from '@repo/types'

type TeamMemberUserApiResponse = {
	id: string
	name: string | null
	email: string
}

type NestedTeamMemberApiResponse = {
	id?: string
	userId?: string
	role: TeamMember['role']
	joinedAt?: string
	user: TeamMemberUserApiResponse
}

export type TeamMemberApiResponse = TeamMember | NestedTeamMemberApiResponse

export type TeamApiResponse = Omit<Team, 'members'> & {
	members: TeamMemberApiResponse[]
}

type InvitationInvitedByApiResponse = {
	id?: string
	name?: string | null
	email?: string
} | null

type InvitationTeamSummaryApiResponse = {
	id?: string
	name?: string
	avatarUrl?: string | null
} | null

export type TeamInvitationApiResponse = {
	id?: string
	teamId?: string
	invitedById?: string
	email?: string
	role?: TeamInvitation['role']
	status?: TeamInvitation['status']
	token?: string
	expiresAt?: string
	createdAt?: string
	updatedAt?: string
	team?: InvitationTeamSummaryApiResponse
	invitedBy?: InvitationInvitedByApiResponse
}

export type MyInvitationApiResponse = {
	id?: string
	email?: string
	role?: MyInvitation['role']
	token?: string
	expiresAt?: string
	createdAt?: string
	team?: InvitationTeamSummaryApiResponse
	invitedBy?: InvitationInvitedByApiResponse
}

function hasNestedUser(
	member: TeamMemberApiResponse,
): member is NestedTeamMemberApiResponse {
	return 'user' in member && member.user !== null && member.user !== undefined
}

export function normalizeTeamMember(member: TeamMemberApiResponse): TeamMember {
	if (!hasNestedUser(member)) {
		return member
	}

	return {
		id: member.id ?? member.userId ?? member.user.id,
		userId: member.userId ?? member.user.id,
		name: member.user.name,
		email: member.user.email,
		role: member.role,
		joinedAt: member.joinedAt ?? '',
	}
}

export function normalizeTeam(team: TeamApiResponse): Team {
	return {
		...team,
		members: team.members.map(normalizeTeamMember),
	}
}

function normalizeInvitationInvitedBy(
	invitedBy?: InvitationInvitedByApiResponse,
): InvitationInvitedBy {
	const source = invitedBy ?? {}

	return {
		id: source.id ?? '',
		name: source.name ?? null,
		email: source.email ?? '',
	}
}

function normalizeInvitationTeamSummary(
	team?: InvitationTeamSummaryApiResponse,
): InvitationTeamSummary {
	const source = team ?? {}

	return {
		id: source.id ?? '',
		name: source.name ?? '',
		avatarUrl: source.avatarUrl ?? null,
	}
}

export function normalizeTeamInvitation(
	invitation: TeamInvitationApiResponse,
): TeamInvitation {
	return {
		id: invitation.id ?? '',
		teamId: invitation.teamId ?? '',
		invitedById: invitation.invitedById ?? '',
		email: invitation.email ?? '',
		role: invitation.role ?? 'MEMBER',
		status: invitation.status ?? 'PENDING',
		token: invitation.token ?? '',
		expiresAt: invitation.expiresAt ?? '',
		createdAt: invitation.createdAt ?? '',
		updatedAt: invitation.updatedAt ?? '',
		invitedBy: normalizeInvitationInvitedBy(invitation.invitedBy),
		team: normalizeInvitationTeamSummary(invitation.team),
	}
}

export function normalizeMyInvitation(invitation: MyInvitationApiResponse): MyInvitation {
	return {
		id: invitation.id ?? '',
		email: invitation.email ?? '',
		role: invitation.role ?? 'MEMBER',
		token: invitation.token ?? '',
		expiresAt: invitation.expiresAt ?? '',
		createdAt: invitation.createdAt ?? '',
		team: normalizeInvitationTeamSummary(invitation.team),
		invitedBy: normalizeInvitationInvitedBy(invitation.invitedBy),
	}
}
