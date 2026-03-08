export const TEAM_ROLES = {
	OWNER: 'OWNER',
	ADMIN: 'ADMIN',
	MEMBER: 'MEMBER',
} as const

export type TeamRole = (typeof TEAM_ROLES)[keyof typeof TEAM_ROLES]

export const ROLES_KEY = 'roles'
