import type { TeamRole } from '@repo/types'

export type TeamMember = {
	id: string
	name: string
	avatar: string
	role: 'owner' | 'member'
}

export type TeamCardModel = {
	id: string
	name: string
	projectCount: number
	members: TeamMember[]
	role?: TeamRole
}
