export const ROUTE_SEGMENTS = {
	teams: 'teams',
	new: 'new',
	projects: 'projects',
	settings: 'settings',
	tasks: 'tasks',
	sprints: 'sprints',
} as const

export const ROUTE_QUERY_PARAMS = {
	from: 'from',
	clearAuth: 'clearAuth',
} as const

export const ROUTES = {
	home: '/',
	login: '/login',
	register: '/register',
	teams: '/teams',
	teamsNew: '/teams/new',
	tasks: '/tasks',
	sprints: '/sprints',
} as const

export const AUTH_ROUTE_PATHS = [ROUTES.login, ROUTES.register] as const

export const PROTECTED_ROUTE_PREFIXES = [
	ROUTES.teams,
	ROUTES.tasks,
	ROUTES.sprints,
] as const

function encodeRouteParam(value: string) {
	return encodeURIComponent(value)
}

function buildTeamProjectsRoute(teamId: string) {
	return `${ROUTES.teams}/${encodeRouteParam(teamId)}/${ROUTE_SEGMENTS.projects}`
}

export const teamRoutes = {
	projects: (teamId: string) => buildTeamProjectsRoute(teamId),
	project: (teamId: string, projectId: string) =>
		`${buildTeamProjectsRoute(teamId)}/${encodeRouteParam(projectId)}`,
	settings: (teamId: string) =>
		`${ROUTES.teams}/${encodeRouteParam(teamId)}/${ROUTE_SEGMENTS.settings}`,
} as const

export const SIDEBAR_ROUTE_IDS = {
	teams: 'teams',
	teamProjects: 'team.projects',
	teamSettings: 'team.settings',
	tasks: 'tasks',
	sprints: 'sprints',
} as const

export type SidebarRouteId = (typeof SIDEBAR_ROUTE_IDS)[keyof typeof SIDEBAR_ROUTE_IDS]

export function buildLoginHref(from?: string | null | undefined) {
	if (!from) {
		return ROUTES.login
	}

	const searchParams = new URLSearchParams({
		[ROUTE_QUERY_PARAMS.from]: from,
	})

	return `${ROUTES.login}?${searchParams.toString()}`
}

export function isSameRouteOrDescendant(pathname: string, route: string) {
	return pathname === route || pathname.startsWith(`${route}/`)
}

export function isAuthRoute(pathname: string) {
	return AUTH_ROUTE_PATHS.some((route) => pathname === route)
}

export function isProtectedRoute(pathname: string) {
	return PROTECTED_ROUTE_PREFIXES.some((route) =>
		isSameRouteOrDescendant(pathname, route),
	)
}

export function getSidebarRouteId(
	pathname: string | null | undefined,
): SidebarRouteId | null {
	if (!pathname) {
		return null
	}

	const segments = pathname.split('/').filter(Boolean)
	const [firstSegment, secondSegment, thirdSegment] = segments

	if (firstSegment === ROUTE_SEGMENTS.tasks) {
		return SIDEBAR_ROUTE_IDS.tasks
	}

	if (firstSegment === ROUTE_SEGMENTS.sprints) {
		return SIDEBAR_ROUTE_IDS.sprints
	}

	if (firstSegment !== ROUTE_SEGMENTS.teams) {
		return null
	}

	if (!secondSegment || secondSegment === ROUTE_SEGMENTS.new) {
		return SIDEBAR_ROUTE_IDS.teams
	}

	if (thirdSegment === ROUTE_SEGMENTS.projects) {
		return SIDEBAR_ROUTE_IDS.teamProjects
	}

	if (thirdSegment === ROUTE_SEGMENTS.settings) {
		return SIDEBAR_ROUTE_IDS.teamSettings
	}

	return null
}
