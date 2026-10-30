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

import type { SidebarNavSection, SidebarWorkspace } from './types'

const teamHref = (teamId: string | null | undefined, route: 'projects' | 'settings') =>
	teamId ? teamRoutes[route](teamId) : undefined
export const sidebarWorkspace: SidebarWorkspace = {
	title: 'Tracker Task',
	subtitle: 'Product Team',
}
export function getSidebarSections(
	activeTeamId?: string | null,
	activeProjectId?: string | null,
	snapshot: FeatureFlagsSnapshot | null = null,
	canManage = false,
	canManageTeam: boolean | null = true,
): SidebarNavSection[] {
	const enabled = (key: string) => hasFeature(snapshot, key)
	const teamReason = !activeTeamId ? 'Сначала выберите команду' : undefined
	const projectReason =
		teamReason ?? (!activeProjectId ? 'Сначала выберите проект' : undefined)
	return [
		{
			title: 'Работа',
			items: [
				{
					title: 'Обзор проекта',
					href:
						activeTeamId && activeProjectId
							? teamRoutes.project(activeTeamId, activeProjectId)
							: undefined,
					disabledReason: projectReason,
					routeId: SIDEBAR_ROUTE_IDS.teamProject,
					icon: LayoutGrid,
				},
				...(enabled(FEATURE_KEYS.BOARDS)
					? [
							{
								title: 'Доска',
								href:
									activeTeamId && activeProjectId
										? teamRoutes.projectBoard(activeTeamId, activeProjectId)
										: undefined,
								disabledReason: projectReason,
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
										: undefined,
								disabledReason: projectReason,
								routeId: SIDEBAR_ROUTE_IDS.tasks,
								icon: ListTodo,
							},
						]
					: []),
				...(enabled(FEATURE_KEYS.BACKLOG)
					? [{ title: 'Бэклог', disabledReason: 'Раздел пока недоступен', icon: Layers3 }]
					: []),
			],
		},
		{
			title: 'Инструменты',
			items: [
				...(enabled(FEATURE_KEYS.AI_ASSISTANT)
					? [
							{
								title: 'AI Ассистент',
								disabledReason: 'Раздел пока недоступен',
								icon: Sparkles,
								iconClassName: 'text-accent',
							},
						]
					: []),
				...(enabled(FEATURE_KEYS.NOTIFICATIONS)
					? [
							{
								title: 'Уведомления',
								disabledReason: 'Раздел пока недоступен',
								icon: Bell,
							},
						]
					: []),
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
					href: teamHref(activeTeamId, 'projects'),
					disabledReason: teamReason,
					routeId: SIDEBAR_ROUTE_IDS.teamProjects,
					icon: FolderKanban,
				},
				...(!activeTeamId || canManageTeam !== false
					? [
							{
								title: 'Настройки команды',
								href: canManageTeam ? teamHref(activeTeamId, 'settings') : undefined,
								disabledReason:
									teamReason ??
									(canManageTeam === null ? 'Проверяем права доступа' : undefined),
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
