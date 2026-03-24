import { describe, expect, it } from 'vitest'

import {
	buildLoginHref,
	getSidebarRouteId,
	isAuthRoute,
	isProtectedRoute,
	SIDEBAR_ROUTE_IDS,
} from '@/shared/config/routes'

describe('buildLoginHref', () => {
	it('без параметра from', () => {
		const result = buildLoginHref()

		expect(result).toBe('/login')
	})

	it('с параметром from', () => {
		const result = buildLoginHref('/teams')

		expect(result).toBe('/login?from=%2Fteams')
	})

	it('from со спецсимволами', () => {
		const result = buildLoginHref('/teams?foo=bar')

		expect(result).toBe('/login?from=%2Fteams%3Ffoo%3Dbar')
	})

	it('from = null', () => {
		const result = buildLoginHref(null)

		expect(result).toBe('/login')
	})

	it('from = пустая строка', () => {
		const result = buildLoginHref('')

		expect(result).toBe('/login')
	})
})

describe('isAuthRoute', () => {
	it('/login', () => {
		expect(isAuthRoute('/login')).toBe(true)
	})

	it('/register', () => {
		expect(isAuthRoute('/register')).toBe(true)
	})

	it('другой путь', () => {
		expect(isAuthRoute('/teams')).toBe(false)
	})

	it('вложенный auth путь', () => {
		expect(isAuthRoute('/login/something')).toBe(false)
	})
})

describe('isProtectedRoute', () => {
	it.each(['/teams', '/tasks', '/sprints'])('%s', (path) => {
		expect(isProtectedRoute(path)).toBe(true)
	})

	it('вложенный путь', () => {
		expect(isProtectedRoute('/teams/123/projects')).toBe(true)
	})

	it('частичное совпадение не срабатывает', () => {
		expect(isProtectedRoute('/teamsters')).toBe(false)
	})

	it('незащищённый путь', () => {
		expect(isProtectedRoute('/login')).toBe(false)
	})

	it('корень', () => {
		expect(isProtectedRoute('/')).toBe(false)
	})
})

describe('getSidebarRouteId', () => {
	it('null', () => {
		expect(getSidebarRouteId(null)).toBeNull()
	})

	it('undefined', () => {
		expect(getSidebarRouteId(undefined)).toBeNull()
	})

	it('/tasks', () => {
		expect(getSidebarRouteId('/tasks')).toBe(SIDEBAR_ROUTE_IDS.tasks)
	})

	it('/sprints', () => {
		expect(getSidebarRouteId('/sprints')).toBe(SIDEBAR_ROUTE_IDS.sprints)
	})

	it('/teams', () => {
		expect(getSidebarRouteId('/teams')).toBe(SIDEBAR_ROUTE_IDS.teams)
	})

	it('/teams/new', () => {
		expect(getSidebarRouteId('/teams/new')).toBe(SIDEBAR_ROUTE_IDS.teams)
	})

	it('/teams/:id/projects', () => {
		expect(getSidebarRouteId('/teams/123/projects')).toBe(SIDEBAR_ROUTE_IDS.teamProjects)
	})

	it('/teams/:id/settings', () => {
		expect(getSidebarRouteId('/teams/123/settings')).toBe(SIDEBAR_ROUTE_IDS.teamSettings)
	})

	it('неизвестный третий сегмент', () => {
		expect(getSidebarRouteId('/teams/123/unknown')).toBeNull()
	})

	it('неизвестный путь', () => {
		expect(getSidebarRouteId('/unknown')).toBeNull()
	})
})
