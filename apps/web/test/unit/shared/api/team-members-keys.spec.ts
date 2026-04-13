import { describe, expect, it } from 'vitest'

import { teamMembersKeys } from '@/shared/api/use-team-members'

describe('teamMembersKeys', () => {
	it('all', () => {
		expect(teamMembersKeys.all).toEqual(['teams', 'members'])
	})

	it('lists', () => {
		expect(teamMembersKeys.lists()).toEqual(['teams', 'members', 'list'])
	})

	it('list', () => {
		expect(teamMembersKeys.list('team-1')).toEqual(['teams', 'members', 'list', 'team-1'])
	})

	it('changeRole', () => {
		expect(teamMembersKeys.changeRole('team-1')).toEqual([
			'teams',
			'members',
			'change-role',
			'team-1',
		])
	})

	it('remove', () => {
		expect(teamMembersKeys.remove('team-1')).toEqual([
			'teams',
			'members',
			'remove',
			'team-1',
		])
	})
})
