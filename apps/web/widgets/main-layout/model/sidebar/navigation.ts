import { FEATURES } from '@/hooks/use-feature-flag'
import { projectCatalog } from '@/lib/projects/catalog'
import { ROUTES, teamRoutes } from '@/shared/config/routes'

import {
	Bell,
	FolderKanban,
	KanbanSquare,
	Layers3,
	ListTodo,
	Settings,
	Sparkles,
	Users,
} from '@repo/ui/icons'

import type {
	SidebarNavSection,
	SidebarProjectItem,
	SidebarUserCard,
	SidebarWorkspace,
} from './types'

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

export function getSidebarSections(activeTeamId?: string | null): SidebarNavSection[] {
	return [
		{
			title: 'Работа',
			items: [
				{
					title: 'Проекты',
					href: getTeamScopedHref(activeTeamId, 'projects'),
					routeId: 'team.projects' as const,
					icon: FolderKanban,
				},
				{
					title: 'Доска',
					href: ROUTES.sprints,
					routeId: 'sprints' as const,
					icon: KanbanSquare,
				},
				{
					title: 'Задачи',
					href: ROUTES.tasks,
					routeId: 'tasks' as const,
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
					title: 'Уведомления',
					href: '#',
					icon: Bell,
				},
				{
					title: 'AI Ассистент',
					href: '#',
					icon: Sparkles,
					iconClassName: 'text-accent',
				},
			],
		},
		{
			title: 'Управление',
			items: [
				{
					title: 'Команды',
					href: ROUTES.teams,
					routeId: 'teams' as const,
					icon: Users,
				},
				...(FEATURES.TEAM_SETTINGS
					? [
							{
								title: 'Настройки',
								href: getTeamScopedHref(activeTeamId, 'settings'),
								routeId: 'team.settings' as const,
								icon: Settings,
							},
						]
					: []),
			],
		},
	]
}

export const sidebarProjects: SidebarProjectItem[] = [
	...projectCatalog.map((project) => ({
		id: project.id,
		shortName: project.code,
		title: project.name,
	})),
]

export const sidebarCurrentUser: SidebarUserCard = {
	initials: 'AI',
	name: 'Алексей Иванов',
	role: 'Owner',
}
