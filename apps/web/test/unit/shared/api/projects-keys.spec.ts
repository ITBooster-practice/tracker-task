import { describe, expect, it } from 'vitest'

import { projectsKeys } from '@/shared/api/use-projects'

describe('projectsKeys', () => {
	it('all', () => {
		expect(projectsKeys.all).toEqual(['projects'])
	})

	it('lists', () => {
		expect(projectsKeys.lists()).toEqual(['projects', 'list'])
	})

	it('teamLists', () => {
		expect(projectsKeys.teamLists('team-1')).toEqual(['projects', 'list', 'team-1'])
	})

	it('list', () => {
		expect(projectsKeys.list('team-1')).toEqual(['projects', 'list', 'team-1', undefined])
	})

	it('list с параметрами', () => {
		expect(projectsKeys.list('team-1', { page: 2, limit: 10 })).toEqual([
			'projects',
			'list',
			'team-1',
			{ page: 2, limit: 10 },
		])
	})

	it('details', () => {
		expect(projectsKeys.details()).toEqual(['projects', 'detail'])
	})

	it('detail', () => {
		expect(projectsKeys.detail('team-1', 'project-1')).toEqual([
			'projects',
			'detail',
			'team-1',
			'project-1',
		])
	})

	it('list разных teamId не совпадают', () => {
		expect(projectsKeys.list('team-1')).not.toEqual(projectsKeys.list('team-2'))
	})

	it('detail разных projectId не совпадают', () => {
		expect(projectsKeys.detail('team-1', 'project-1')).not.toEqual(
			projectsKeys.detail('team-1', 'project-2'),
		)
	})

	it('detail разных teamId не совпадают', () => {
		expect(projectsKeys.detail('team-1', 'project-1')).not.toEqual(
			projectsKeys.detail('team-2', 'project-1'),
		)
	})

	it('все ключи начинаются с "projects"', () => {
		const keys = [
			projectsKeys.all,
			projectsKeys.lists(),
			projectsKeys.list('team-1'),
			projectsKeys.details(),
			projectsKeys.detail('team-1', 'project-1'),
		]

		keys.forEach((key) => {
			expect(key[0]).toBe('projects')
		})
	})
})
