import type { TeamRole } from './team-role.constants'

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
