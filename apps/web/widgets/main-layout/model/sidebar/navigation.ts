import {
	Bell,
	FolderKanban,
	KanbanSquare,
	Layers3,
	LayoutGrid,
	ListTodo,
	Settings,
	Shield,
	Sparkles,
	Users,
} from '@repo/ui/icons'

import { FEATURES, ROUTES, SIDEBAR_ROUTE_IDS, teamRoutes } from '@/shared/config'

import type { SidebarNavSection, SidebarUserCard, SidebarWorkspace } from './types'

function getTeamScopedHref(
	teamId: string | null | undefined,
	route: 'projects' | 'settings',
) {
	if (!teamId) {
		return '#'
	}

	return teamRoutes[route](teamId)
}

export const sidebarWorkspace: SidebarWorkspace = {
	title: 'Tracker Task',
	subtitle: 'Product Team',
}

export function getSidebarSections(
	activeTeamId?: string | null,
	activeProjectId?: string | null,
): SidebarNavSection[] {
	const projectOverviewItem =
		activeTeamId && activeProjectId
			? [
					{
						title: 'Обзор проекта',
						href: teamRoutes.project(activeTeamId, activeProjectId),
						routeId: SIDEBAR_ROUTE_IDS.teamProject,
						icon: LayoutGrid,
					},
				]
			: []

	return [
		{
			title: 'Работа',
			items: [
				...projectOverviewItem,
				{
					title: 'Доска',
					href: ROUTES.boards,
					routeId: SIDEBAR_ROUTE_IDS.boards,
					icon: KanbanSquare,
				},
				{
					title: 'Задачи',
					href: ROUTES.tasks,
					routeId: SIDEBAR_ROUTE_IDS.tasks,
					icon: ListTodo,
				},
				{
					title: 'Бэклог',
					href: '#',
					icon: Layers3,
				},
			],
		},
		{
			title: 'Инструменты',
			items: [
				{
					title: 'AI Ассистент',
					href: '#',
					icon: Sparkles,
					iconClassName: 'text-accent',
				},
				{
					title: 'Уведомления',
					href: '#',
					icon: Bell,
				},
			],
		},
		{
			title: 'Управление',
			items: [
				{
					title: 'Команды',
					href: ROUTES.teams,
					routeId: SIDEBAR_ROUTE_IDS.teams,
					icon: Users,
				},
				{
					title: 'Проекты',
					href: getTeamScopedHref(activeTeamId, 'projects'),
					routeId: SIDEBAR_ROUTE_IDS.teamProjects,
					icon: FolderKanban,
				},
				...(FEATURES.TEAM_SETTINGS
					? [
							{
								title: 'Настройки команды',
								href: getTeamScopedHref(activeTeamId, 'settings'),
								routeId: SIDEBAR_ROUTE_IDS.teamSettings,
								icon: Settings,
							},
						]
					: []),
				{
					title: 'Администрирование',
					href: '#',
					icon: Shield,
				},
			],
		},
	]
}

export const sidebarCurrentUser: SidebarUserCard = {
	initials: 'AI',
	name: 'Алексей Иванов',
	role: 'Owner',
}
