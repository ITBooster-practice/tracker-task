import { describe, expect, it } from 'vitest'

import { TEAM_ROLES, type TeamListItem } from '@repo/types'

import { mapTeamListItemToTeamCardModel } from '@/views/teams/lib/mappers'

// Хелпер: базовый TeamListItem, переопределяем только нужные поля
function createTeamListItem(overrides: Partial<TeamListItem> = {}): TeamListItem {
	return {
		id: 'team-1',
		name: 'My Team',
		description: null,
		avatarUrl: null,
		membersCount: 1,
		currentUserRole: TEAM_ROLES.MEMBER,
		createdAt: '2025-01-01',
		updatedAt: '2025-01-01',
		...overrides,
	}
}

describe('mapTeamListItemToTeamCardModel', () => {
	it('корректно маппит id, name и membersCount в модель', () => {
		const team = createTeamListItem({ id: 'abc', name: 'Design Team' })

		const result = mapTeamListItemToTeamCardModel(team)

		expect(result.id).toBe('abc')
		expect(result.name).toBe('Design Team')
		expect(result.projectCount).toBe(0)
		expect(result.members).toHaveLength(1)
	})

	it('membersCount = 0 → members: []', () => {
		const team = createTeamListItem({ membersCount: 0 })

		const result = mapTeamListItemToTeamCardModel(team)

		expect(result.members).toEqual([])
	})

	it('инициалы из двух слов', () => {
		const team = createTeamListItem({ name: 'Design Team' })

		const result = mapTeamListItemToTeamCardModel(team)

		expect(result.members[0]!.avatar).toBe('DT')
	})

	it('инициалы из одного слова', () => {
		const team = createTeamListItem({ name: 'Backend' })

		const result = mapTeamListItemToTeamCardModel(team)

		expect(result.members[0]!.avatar).toBe('B')
	})

	it('пустое имя — fallback TM', () => {
		const team = createTeamListItem({ name: '' })

		const result = mapTeamListItemToTeamCardModel(team)

		expect(result.members[0]!.avatar).toBe('TM')
	})

	it('количество members соответствует membersCount', () => {
		const team = createTeamListItem({ membersCount: 3 })

		const result = mapTeamListItemToTeamCardModel(team)

		expect(result.members).toHaveLength(3)
	})

	it('owner — первый member получает role owner', () => {
		const team = createTeamListItem({
			membersCount: 2,
			currentUserRole: TEAM_ROLES.OWNER,
		})

		const result = mapTeamListItemToTeamCardModel(team)

		expect(result.members[0]!.role).toBe('owner')
		expect(result.members[1]!.role).toBe('member')
	})

	it('не owner — все members получают role member', () => {
		const team = createTeamListItem({
			membersCount: 2,
			currentUserRole: TEAM_ROLES.MEMBER,
		})

		const result = mapTeamListItemToTeamCardModel(team)

		expect(result.members[0]!.role).toBe('member')
		expect(result.members[1]!.role).toBe('member')
	})

	it('каждый member получает ожидаемую структуру', () => {
		const team = createTeamListItem({ id: 'team-9', membersCount: 2 })

		const result = mapTeamListItemToTeamCardModel(team)

		expect(result.members).toEqual([
			{
				id: 'team-9-member-1',
				name: 'Участник 1',
				avatar: 'MT',
				role: 'member',
			},
			{
				id: 'team-9-member-2',
				name: 'Участник 2',
				avatar: 'MT',
				role: 'member',
			},
		])
	})
})
