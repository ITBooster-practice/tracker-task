import { describe, expect, it } from 'vitest'

import { teamsKeys } from '@/shared/api/use-teams'

describe('teamsKeys', () => {
	it('all', () => {
		expect(teamsKeys.all).toEqual(['teams'])
	})

	it('lists', () => {
		expect(teamsKeys.lists()).toEqual(['teams', 'list'])
	})

	it('list', () => {
		expect(teamsKeys.list()).toEqual([...teamsKeys.lists(), undefined])
	})

	it('detail', () => {
		expect(teamsKeys.detail('abc-123')).toEqual(['teams', 'detail', 'abc-123'])
	})

	it('create', () => {
		expect(teamsKeys.create()).toEqual(['teams', 'create'])
	})

	it('update', () => {
		expect(teamsKeys.update('abc-123')).toEqual(['teams', 'update', 'abc-123'])
	})

	it('delete', () => {
		expect(teamsKeys.delete('abc-123')).toEqual(['teams', 'delete', 'abc-123'])
	})

	it('detail разных id', () => {
		expect(teamsKeys.detail('a')).not.toEqual(teamsKeys.detail('b'))
	})

	it('все ключи начинаются с "teams"', () => {
		const keys = [
			teamsKeys.all,
			teamsKeys.lists(),
			teamsKeys.list(),
			teamsKeys.details(),
			teamsKeys.detail('x'),
			teamsKeys.create(),
			teamsKeys.update('x'),
			teamsKeys.delete('x'),
		]

		keys.forEach((key) => {
			expect(key[0]).toBe('teams')
		})
	})
})
