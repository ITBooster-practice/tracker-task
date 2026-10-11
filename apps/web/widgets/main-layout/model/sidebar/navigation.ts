import { FEATURE_KEYS, type FeatureFlagsSnapshot } from '@repo/types'
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

import { ROUTES, SIDEBAR_ROUTE_IDS, teamRoutes } from '@/shared/config/routes'
import { hasFeature } from '@/shared/lib/feature-flags/feature-flags'

import type { SidebarNavSection, SidebarUserCard, SidebarWorkspace } from './types'

const teamHref = (teamId: string | null | undefined, route: 'projects' | 'settings') =>
	teamId ? teamRoutes[route](teamId) : '#'
export const sidebarWorkspace: SidebarWorkspace = {
	title: 'Tracker Task',
	subtitle: 'Product Team',
}
export function getSidebarSections(
	activeTeamId?: string | null,
	activeProjectId?: string | null,
	snapshot: FeatureFlagsSnapshot | null = null,
	canManage = false,
): SidebarNavSection[] {
	const enabled = (key: string) => hasFeature(snapshot, key)
	return [
		{
			title: 'Работа',
			items: [
				...(activeTeamId && activeProjectId && enabled(FEATURE_KEYS.PROJECTS)
					? [
							{
								title: 'Обзор проекта',
								href: teamRoutes.project(activeTeamId, activeProjectId),
								routeId: SIDEBAR_ROUTE_IDS.teamProject,
								icon: LayoutGrid,
							},
						]
					: []),
				...(enabled(FEATURE_KEYS.BOARDS)
					? [
							{
								title: 'Доска',
								href: ROUTES.boards,
								routeId: SIDEBAR_ROUTE_IDS.boards,
								icon: KanbanSquare,
							},
						]
					: []),
				...(enabled(FEATURE_KEYS.TASKS)
					? [
							{
								title: 'Задачи',
								href:
									activeTeamId && activeProjectId
										? teamRoutes.projectTasks(activeTeamId, activeProjectId)
										: '#',
								routeId: SIDEBAR_ROUTE_IDS.tasks,
								icon: ListTodo,
							},
						]
					: []),
				...(enabled(FEATURE_KEYS.BACKLOG)
					? [{ title: 'Бэклог', href: '#', icon: Layers3 }]
					: []),
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
				{ title: 'Уведомления', href: '#', icon: Bell },
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
				...(enabled(FEATURE_KEYS.PROJECTS)
					? [
							{
								title: 'Проекты',
								href: teamHref(activeTeamId, 'projects'),
								routeId: SIDEBAR_ROUTE_IDS.teamProjects,
								icon: FolderKanban,
							},
						]
					: []),
				...(enabled(FEATURE_KEYS.TEAM_SETTINGS)
					? [
							{
								title: 'Настройки команды',
								href: teamHref(activeTeamId, 'settings'),
								routeId: SIDEBAR_ROUTE_IDS.teamSettings,
								icon: Settings,
							},
						]
					: []),
				...(canManage
					? [
							{
								title: 'Флаги функций',
								href: ROUTES.featureFlags,
								routeId: SIDEBAR_ROUTE_IDS.featureFlags,
								icon: Shield,
							},
						]
					: []),
			],
		},
	]
}
export const sidebarCurrentUser: SidebarUserCard = {
	initials: 'AI',
	name: 'Алексей Иванов',
	role: 'Owner',
}
