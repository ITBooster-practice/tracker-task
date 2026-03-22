import { describe, expect, it, vi } from 'vitest'

import {
	buildTeamProjectHref,
	createProjectId,
	formatProjectNameFromId,
	getProjectById,
} from '@/shared/lib/projects/catalog'

// Мокаем модуль config ДО импорта catalog.ts
// Почему: catalog.ts импортирует teamRoutes при загрузке.
// vi.mock подменяет модуль на уровне загрузчика, поэтому
// когда catalog.ts сделает import { teamRoutes } — получит наш мок.
vi.mock('@/shared/config', () => ({
	teamRoutes: {
		project: (teamId: string, projectId: string) =>
			`/teams/${teamId}/projects/${projectId}`,
	},
}))

describe('buildTeamProjectHref', () => {
	it('оба параметра переданы — возвращает href', () => {
		const result = buildTeamProjectHref('team-1', 'project-1')

		expect(result).toBe('/teams/team-1/projects/project-1')
	})

	it('teamId = null', () => {
		expect(buildTeamProjectHref(null, 'project-1')).toBe('#')
	})

	it('projectId = undefined', () => {
		expect(buildTeamProjectHref('team-1', undefined)).toBe('#')
	})

	it('оба пустые', () => {
		expect(buildTeamProjectHref(null, null)).toBe('#')
	})
})

describe('getProjectById', () => {
	it('существующий проект', () => {
		const result = getProjectById('tracker-task')

		expect(result).not.toBeNull()
		expect(result!.name).toBe('Tracker Task')
	})

	it('несуществующий проект', () => {
		expect(getProjectById('nonexistent')).toBeNull()
	})
})

describe('formatProjectNameFromId', () => {
	it('slug с дефисами', () => {
		expect(formatProjectNameFromId('tracker-task')).toBe('Tracker Task')
	})

	it('slug с подчёркиванием', () => {
		expect(formatProjectNameFromId('my_project')).toBe('My Project')
	})

	it('одно слово', () => {
		expect(formatProjectNameFromId('backend')).toBe('Backend')
	})

	it('URL-encoded символы', () => {
		expect(formatProjectNameFromId('%D0%BF%D1%80%D0%BE%D0%B5%D0%BA%D1%82')).toBe('Проект')
	})
})

describe('createProjectId', () => {
	it('обычное имя', () => {
		expect(createProjectId('My Project', [])).toBe('my-project')
	})

	it('дубликат', () => {
		expect(createProjectId('My Project', ['my-project'])).toBe('my-project-2')
	})

	it('несколько дубликатов → инкрементирует суффикс', () => {
		const existing = ['my-project', 'my-project-2', 'my-project-3']

		expect(createProjectId('My Project', existing)).toBe('my-project-4')
	})

	it('спецсимволы фильтруются', () => {
		expect(createProjectId('Hello! World?', [])).toBe('hello-world')
	})

	it('пустое имя', () => {
		expect(createProjectId('', [])).toBe('project-1')
	})

	it('пустое имя + есть существующие', () => {
		expect(createProjectId('', ['a', 'b'])).toBe('project-3')
	})

	it('кириллица в имени', () => {
		expect(createProjectId('Мой Проект', [])).toBe('мой-проект')
	})

	it('множественные пробелы → один дефис', () => {
		expect(createProjectId('my   project', [])).toBe('my-project')
	})
})
