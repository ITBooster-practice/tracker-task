import { describe, expect, it } from 'vitest'

import { tasksKeys } from '@/shared/api/use-tasks'

describe('tasksKeys', () => {
	it('all', () => {
		expect(tasksKeys.all).toEqual(['tasks'])
	})

	it('lists', () => {
		expect(tasksKeys.lists()).toEqual(['tasks', 'list'])
	})

	it('projectLists', () => {
		expect(tasksKeys.projectLists('team-1', 'project-1')).toEqual([
			'tasks',
			'list',
			'team-1',
			'project-1',
		])
	})

	it('list без параметров', () => {
		expect(tasksKeys.list('team-1', 'project-1')).toEqual([
			'tasks',
			'list',
			'team-1',
			'project-1',
			undefined,
		])
	})

	it('list с параметрами фильтрации', () => {
		expect(tasksKeys.list('team-1', 'project-1', { status: 'TODO', page: 2 })).toEqual([
			'tasks',
			'list',
			'team-1',
			'project-1',
			{ status: 'TODO', page: 2 },
		])
	})

	it('details', () => {
		expect(tasksKeys.details()).toEqual(['tasks', 'detail'])
	})

	it('detail', () => {
		expect(tasksKeys.detail('team-1', 'project-1', 'task-1')).toEqual([
			'tasks',
			'detail',
			'team-1',
			'project-1',
			'task-1',
		])
	})

	it('list разных projectId не совпадают', () => {
		expect(tasksKeys.list('team-1', 'project-1')).not.toEqual(
			tasksKeys.list('team-1', 'project-2'),
		)
	})

	it('list разных teamId не совпадают', () => {
		expect(tasksKeys.list('team-1', 'project-1')).not.toEqual(
			tasksKeys.list('team-2', 'project-1'),
		)
	})

	it('detail разных taskId не совпадают', () => {
		expect(tasksKeys.detail('team-1', 'project-1', 'task-1')).not.toEqual(
			tasksKeys.detail('team-1', 'project-1', 'task-2'),
		)
	})

	it('все ключи начинаются с "tasks"', () => {
		const keys = [
			tasksKeys.all,
			tasksKeys.lists(),
			tasksKeys.projectLists('team-1', 'project-1'),
			tasksKeys.list('team-1', 'project-1'),
			tasksKeys.details(),
			tasksKeys.detail('team-1', 'project-1', 'task-1'),
		]

		keys.forEach((key) => {
			expect(key[0]).toBe('tasks')
		})
	})
})
