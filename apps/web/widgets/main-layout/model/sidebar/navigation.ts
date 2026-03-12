import { FEATURES } from '@/hooks/use-feature-flag'
import { projectCatalog } from '@/lib/projects/catalog'

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

	return `/teams/${encodeURIComponent(teamId)}/${route}`
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
					icon: FolderKanban,
					match: (pathname?: string) =>
						Boolean(pathname?.match(/^\/teams\/[^/]+\/projects(?:\/[^/]+)?\/?$/)),
				},
				{
					title: 'Доска',
					href: '/sprints',
					icon: KanbanSquare,
				},
				{
					title: 'Задачи',
					href: '/tasks',
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
					href: '/teams',
					icon: Users,
					match: (pathname) => pathname === '/teams' || pathname === '/teams/new',
				},
				...(FEATURES.TEAM_SETTINGS
					? [
							{
								title: 'Настройки',
								href: getTeamScopedHref(activeTeamId, 'settings'),
								icon: Settings,
								match: (pathname?: string) =>
									Boolean(
										pathname?.startsWith('/teams/') && pathname?.endsWith('/settings'),
									),
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
