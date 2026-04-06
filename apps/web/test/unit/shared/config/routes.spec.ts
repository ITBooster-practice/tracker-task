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

	it("buildLoginHref('/teams/1') → /login?from=%2Fteams%2F1", () => {
		expect(buildLoginHref('/teams/1')).toBe('/login?from=%2Fteams%2F1')
	})

	it("buildLoginHref('/a b') → корректный URL-encode пробела", () => {
		expect(buildLoginHref('/a b')).toBe('/login?from=%2Fa+b')
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
	it("isAuthRoute('/login') → true", () => {
		expect(isAuthRoute('/login')).toBe(true)
	})

	it("isAuthRoute('/register') → true", () => {
		expect(isAuthRoute('/register')).toBe(true)
	})

	it("isAuthRoute('/teams') → false", () => {
		expect(isAuthRoute('/teams')).toBe(false)
	})

	it('вложенный auth путь', () => {
		expect(isAuthRoute('/login/something')).toBe(false)
	})
})

describe('isProtectedRoute', () => {
	it("isProtectedRoute('/teams') → true", () => {
		expect(isProtectedRoute('/teams')).toBe(true)
	})

	it("isProtectedRoute('/teams/1/projects') → true", () => {
		expect(isProtectedRoute('/teams/1/projects')).toBe(true)
	})

	it("isProtectedRoute('/login') → false", () => {
		expect(isProtectedRoute('/login')).toBe(false)
	})

	it("isProtectedRoute('/register') → false", () => {
		expect(isProtectedRoute('/register')).toBe(false)
	})

	it("isProtectedRoute('/') → false", () => {
		expect(isProtectedRoute('/')).toBe(false)
	})

	it('частичное совпадение не срабатывает', () => {
		expect(isProtectedRoute('/teamsters')).toBe(false)
	})
})

describe('getSidebarRouteId', () => {
	it('null', () => {
		expect(getSidebarRouteId(null)).toBeNull()
	})

	it('undefined', () => {
		expect(getSidebarRouteId(undefined)).toBeNull()
	})

	it("getSidebarRouteId('/tasks') → 'tasks'", () => {
		expect(getSidebarRouteId('/tasks')).toBe(SIDEBAR_ROUTE_IDS.tasks)
	})

	it("getSidebarRouteId('/sprints') → 'sprints'", () => {
		expect(getSidebarRouteId('/sprints')).toBe(SIDEBAR_ROUTE_IDS.sprints)
	})

	it("getSidebarRouteId('/teams') → 'teams'", () => {
		expect(getSidebarRouteId('/teams')).toBe(SIDEBAR_ROUTE_IDS.teams)
	})

	it('/teams/new', () => {
		expect(getSidebarRouteId('/teams/new')).toBe(SIDEBAR_ROUTE_IDS.teams)
	})

	it("getSidebarRouteId('/teams/1/projects/p') → 'team.projects'", () => {
		expect(getSidebarRouteId('/teams/1/projects/p')).toBe(SIDEBAR_ROUTE_IDS.teamProjects)
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
