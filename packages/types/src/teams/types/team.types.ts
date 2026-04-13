import type { TeamRole } from '../constants/team-role.constants'
import type { TeamInvitationStatus } from '../constants/team-invitation-status.constants'

export interface TeamMember {
	id: string
	userId: string
	name: string | null
	email: string
	role: TeamRole
	joinedAt: string
}

export interface Team {
	id: string
	name: string
	description: string | null
	avatarUrl: string | null
	members: TeamMember[]
	createdAt: string
	updatedAt: string
}

export interface TeamListItem {
	id: string
	name: string
	description: string | null
	avatarUrl: string | null
	membersCount: number
	currentUserRole: TeamRole
	createdAt: string
	updatedAt: string
}

export interface DeleteTeamResponse {
	message: string
	success: boolean
}

export interface InvitationInvitedBy {
	id: string
	name: string | null
	email: string
}

export interface InvitationTeamSummary {
	id: string
	name: string
	avatarUrl: string | null
}

export interface TeamInvitation {
	id: string
	teamId: string
	invitedById: string
	email: string
	role: TeamRole
	status: TeamInvitationStatus
	token: string
	expiresAt: string
	createdAt: string
	updatedAt: string
	invitedBy: InvitationInvitedBy
	team: InvitationTeamSummary
}

export interface MyInvitation {
	id: string
	email: string
	role: TeamRole
	token: string
	expiresAt: string
	createdAt: string
	team: InvitationTeamSummary
	invitedBy: InvitationInvitedBy
}
