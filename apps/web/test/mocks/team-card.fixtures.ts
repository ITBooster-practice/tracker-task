import type { TeamCardModel } from '@/views/teams/model/types'

export const createTeamMember = (id: string, name: string) => ({
	id,
	name,
	avatar: name.slice(0, 2).toUpperCase(),
	role: 'member' as const,
})

export const createTeamCardModel = (
	overrides?: Partial<TeamCardModel>,
): TeamCardModel => ({
	id: '1',
	name: 'Dream Team',
	projectCount: 3,
	members: [createTeamMember('m1', 'Alice'), createTeamMember('m2', 'Bob')],
	...overrides,
})
