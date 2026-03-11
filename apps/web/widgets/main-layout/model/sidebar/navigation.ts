import { FEATURES } from '@/hooks/use-feature-flag'

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

export const sidebarWorkspace: SidebarWorkspace = {
	title: 'Tracker Task',
	subtitle: 'Product Team',
}

export const sidebarSections: SidebarNavSection[] = [
	{
		title: 'Работа',
		items: [
			{
				title: 'Проекты',
				href: '/projects',
				icon: FolderKanban,
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
							href: '/teams/product-team/settings',
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

export const sidebarProjects: SidebarProjectItem[] = [
	{
		shortName: 'TT',
		title: 'Tracker Task',
	},
]

export const sidebarCurrentUser: SidebarUserCard = {
	initials: 'AI',
	name: 'Алексей Иванов',
	role: 'Owner',
}
