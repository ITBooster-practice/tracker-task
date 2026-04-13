import { TEAM_ROLES, type Team, type TeamListItem, type TeamMember } from '@repo/types'

export const createTeamMemberFixture = (overrides?: Partial<TeamMember>): TeamMember => ({
	id: 'user-1',
	userId: 'u-1',
	name: 'Alice Member',
	email: 'alice@example.com',
	role: TEAM_ROLES.MEMBER,
	joinedAt: '2024-01-01',
	...overrides,
})

export const createTeamFixture = (overrides?: Partial<Team>): Team => ({
	id: 'team-1',
	name: 'Alpha Team',
	description: null,
	avatarUrl: null,
	members: [],
	createdAt: '2024-01-01',
	updatedAt: '2024-01-01',
	...overrides,
})

export const createTeamListItemFixture = (
	overrides?: Partial<TeamListItem>,
): TeamListItem => ({
	id: 'team-1',
	name: 'Alpha Team',
	description: null,
	avatarUrl: null,
	membersCount: 3,
	currentUserRole: TEAM_ROLES.MEMBER,
	createdAt: '2024-01-01',
	updatedAt: '2024-01-01',
	...overrides,
})
