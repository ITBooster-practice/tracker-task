export const ROUTE_SEGMENTS = {
	teams: 'teams',
	new: 'new',
	projects: 'projects',
	settings: 'settings',
	tasks: 'tasks',
	sprints: 'sprints',
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

export const teamRoutes = {
	projects: (teamId: string) =>
		`${ROUTES.teams}/${encodeURIComponent(teamId)}/${ROUTE_SEGMENTS.projects}`,
	settings: (teamId: string) =>
		`${ROUTES.teams}/${encodeURIComponent(teamId)}/${ROUTE_SEGMENTS.settings}`,
} as const

export type SidebarRouteId =
	| 'teams'
	| 'team.projects'
	| 'team.settings'
	| 'tasks'
	| 'sprints'

export function getSidebarRouteId(
	pathname: string | null | undefined,
): SidebarRouteId | null {
	if (!pathname) {
		return null
	}

	const segments = pathname.split('/').filter(Boolean)
	const [firstSegment, secondSegment, thirdSegment] = segments

	if (firstSegment === ROUTE_SEGMENTS.tasks) {
		return 'tasks'
	}

	if (firstSegment === ROUTE_SEGMENTS.sprints) {
		return 'sprints'
	}

	if (firstSegment !== ROUTE_SEGMENTS.teams) {
		return null
	}

	if (!secondSegment || secondSegment === ROUTE_SEGMENTS.new) {
		return 'teams'
	}

	if (thirdSegment === ROUTE_SEGMENTS.projects) {
		return 'team.projects'
	}

	if (thirdSegment === ROUTE_SEGMENTS.settings) {
		return 'team.settings'
	}

	return null
}
