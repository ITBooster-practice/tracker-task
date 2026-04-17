import { describe, expect, it, vi } from 'vitest'

import { getSidebarSections } from '@/widgets/main-layout/model/sidebar/navigation'

// Мокаем конфиг — контролируем feature flags и роуты
const { mockFeatures } = vi.hoisted(() => ({
	mockFeatures: {
		PROJECTS: true,
		TASKS: true,
		BOARDS: true,
		TEAM_SETTINGS: true,
	},
}))

vi.mock('@/shared/config', () => ({
	FEATURES: mockFeatures,
	ROUTES: {
		teams: '/teams',
		tasks: '/tasks',
		boards: '/boards',
	},
	SIDEBAR_ROUTE_IDS: {
		teams: 'teams',
		teamProjects: 'team.projects',
		teamSettings: 'team.settings',
		tasks: 'tasks',
		boards: 'boards',
	},
	teamRoutes: {
		projects: (teamId: string) => `/teams/${teamId}/projects`,
		settings: (teamId: string) => `/teams/${teamId}/settings`,
	},
}))

function findItem(sections: ReturnType<typeof getSidebarSections>, title: string) {
	for (const section of sections) {
		const found = section.items.find((item) => item.title === title)
		if (found) return found
	}
	return undefined
}

describe('getSidebarSections', () => {
	it('Проекты: teamId есть', () => {
		const sections = getSidebarSections('team-1')
		const item = findItem(sections, 'Проекты')

		expect(item?.href).toBe('/teams/team-1/projects')
	})

	it('Проекты: teamId = null', () => {
		const sections = getSidebarSections(null)
		const item = findItem(sections, 'Проекты')

		expect(item?.href).toBe('#')
	})

	it('Доска ведёт на канонический /boards', () => {
		const sections = getSidebarSections('team-1')
		const item = findItem(sections, 'Доска')

		expect(item?.href).toBe('/boards')
		expect(item?.routeId).toBe('boards')
	})

	it('Настройки: TEAM_SETTINGS включён', () => {
		mockFeatures.TEAM_SETTINGS = true

		const sections = getSidebarSections('team-1')
		const item = findItem(sections, 'Настройки')

		expect(item).toBeDefined()
		expect(item?.href).toBe('/teams/team-1/settings')
	})

	it('Настройки: TEAM_SETTINGS выключен', () => {
		mockFeatures.TEAM_SETTINGS = false

		const sections = getSidebarSections('team-1')
		const item = findItem(sections, 'Настройки')

		expect(item).toBeUndefined()
	})

	it('всегда содержит секции Работа, Инструменты, Управление', () => {
		const sections = getSidebarSections('team-1')
		const titles = sections.map((s) => s.title)

		expect(titles).toEqual(['Работа', 'Инструменты', 'Управление'])
	})
})
