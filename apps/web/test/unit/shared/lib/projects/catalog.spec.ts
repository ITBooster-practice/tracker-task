import { describe, expect, it, vi } from 'vitest'

import {
	buildTeamProjectHref,
	createProjectId,
	formatProjectNameFromId,
	getProjectById,
	normalizeProjectId,
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
	it("buildTeamProjectHref('team-1', 'proj-2') → /teams/team-1/projects/proj-2", () => {
		const result = buildTeamProjectHref('team-1', 'proj-2')

		expect(result).toBe('/teams/team-1/projects/proj-2')
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
	it("getProjectById('существующий-id') → возвращает ProjectCatalogItem", () => {
		const result = getProjectById('tracker-task')

		expect(result).toEqual(
			expect.objectContaining({
				id: 'tracker-task',
				name: 'Tracker Task',
				code: 'TT',
			}),
		)
	})

	it("getProjectById('несуществующий') → undefined", () => {
		expect(getProjectById('nonexistent')).toBeUndefined()
	})
})

describe('formatProjectNameFromId', () => {
	it("formatProjectNameFromId('TRACKER_2') → корректное человекочитаемое название", () => {
		expect(formatProjectNameFromId('TRACKER_2')).toBe('Tracker 2')
	})

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
	it("createProjectId('My Project') → нормализованный slug", () => {
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

	it('кириллица в имени транслитерируется', () => {
		expect(createProjectId('Мой Проект', [])).toBe('moy-proekt')
	})

	it('множественные пробелы → один дефис', () => {
		expect(createProjectId('my   project', [])).toBe('my-project')
	})
})

describe('normalizeProjectId', () => {
	it('транслитерирует кириллицу, убирает пробелы и приводит к upper snake_case', () => {
		expect(normalizeProjectId('Мой проект 2!')).toBe('MOY_PROEKT_2')
	})
})
