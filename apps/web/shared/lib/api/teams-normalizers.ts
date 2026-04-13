import type {
	InvitationInvitedBy,
	InvitationTeamSummary,
	MyInvitation,
	Team,
	TeamInvitation,
	TeamMember,
} from '@repo/types'

export type TeamApiMember = Partial<TeamMember> & {
	user?: {
		id?: string
		name?: string | null
		email?: string
	} | null
}

export type TeamApiResponse = Omit<Team, 'members'> & {
	members: TeamApiMember[]
}

export type TeamInvitationApiResponse = Omit<
	Partial<TeamInvitation>,
	'team' | 'invitedBy'
> & {
	team?: Partial<InvitationTeamSummary> | null
	invitedBy?: Partial<InvitationInvitedBy> | null
}

export type MyInvitationApiResponse = Omit<
	Partial<MyInvitation>,
	'team' | 'invitedBy'
> & {
	team?: Partial<InvitationTeamSummary> | null
	invitedBy?: Partial<InvitationInvitedBy> | null
}

export function normalizeTeamMember(member: TeamApiMember): TeamMember {
	return {
		id: member.id ?? member.userId ?? member.user?.id ?? '',
		userId: member.userId ?? member.user?.id ?? '',
		name: member.name ?? member.user?.name ?? null,
		email: member.email ?? member.user?.email ?? '',
		role: member.role ?? 'MEMBER',
		joinedAt: member.joinedAt ?? '',
	}
}

export function normalizeTeam(team: TeamApiResponse): Team {
	return {
		...team,
		members: Array.isArray(team.members) ? team.members.map(normalizeTeamMember) : [],
	}
}

export function normalizeInvitationInvitedBy(
	invitedBy?: Partial<InvitationInvitedBy> | null,
): InvitationInvitedBy {
	return {
		id: invitedBy?.id ?? '',
		name: invitedBy?.name ?? null,
		email: invitedBy?.email ?? '',
	}
}

export function normalizeInvitationTeamSummary(
	team?: Partial<InvitationTeamSummary> | null,
): InvitationTeamSummary {
	return {
		id: team?.id ?? '',
		name: team?.name ?? '',
		avatarUrl: team?.avatarUrl ?? null,
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
