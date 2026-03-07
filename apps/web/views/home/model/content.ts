import type { ComponentType, SVGProps } from 'react'

import {
	BookOpen,
	Brain,
	CheckCircle2,
	KanbanSquare,
	Radio,
	Server,
	Shield,
	Terminal,
	Users,
	Zap,
} from '@repo/ui/icons'

type IconType = ComponentType<SVGProps<SVGSVGElement>>

export const navigationItems = [
	{ label: 'Возможности', href: '#features' },
	{ label: 'Установка', href: '#deploy' },
	{ label: 'Сообщество', href: '#community' },
] as const

export const heroBadge = {
	icon: Shield,
	label: 'Open Source & Self-Hosted',
} as const

export const heroActions = {
	primary: {
		label: 'Попробовать демо',
		href: '/projects',
	},
	secondary: {
		label: 'Развернуть',
		href: '#deploy',
		icon: Terminal,
	},
} as const

export const features: Array<{
	icon: IconType
	title: string
	description: string
	highlight?: boolean
}> = [
	{
		icon: Server,
		title: 'Свой сервер',
		description: 'Полный контроль над данными. Разверните на своём сервере за минуты.',
	},
	{
		icon: Zap,
		title: 'Быстрый старт',
		description: 'Минимальный порог входа. Начните работать без долгой настройки.',
	},
	{
		icon: KanbanSquare,
		title: 'Kanban-first',
		description: 'Визуальное управление задачами с drag & drop. Интуитивно и быстро.',
	},
	{
		icon: Brain,
		title: 'AI-помощник',
		description: 'Генерация эпиков и задач из описания. Ускоряет планирование в разы.',
	},
	{
		icon: Radio,
		title: 'Мгновенные события',
		description: 'Мгновенные уведомления через WebSocket. Команда всегда в курсе.',
	},
	{
		icon: Users,
		title: 'Для команд 3-15',
		description:
			'Оптимизировано для небольших продуктовых команд. Роли, права и приглашения.',
		highlight: true,
	},
] as const

export const boardColumns = [
	{ title: 'To Do', count: 2 },
	{ title: 'In Progress', count: 3 },
	{ title: 'Review', count: 1 },
	{ title: 'Done', count: 2 },
] as const

export const deploySteps = [
	{
		step: '1',
		code: 'git clone https://github.com/ITBooster-practice/tracker-task.git',
	},
	{
		step: '2',
		code: 'cd tracker-task && cp apps/api/.env.example apps/api/.env',
	},
	{
		step: '3',
		code: 'docker compose up -d',
	},
	{
		step: '4',
		code: 'open http://localhost:3001',
	},
] as const

export const communityActions: Array<{
	label: string
	href: string
	icon: IconType
}> = [
	{ label: 'Дорожная карта', href: '#', icon: CheckCircle2 },
	{ label: 'Как внести вклад', href: '#', icon: BookOpen },
] as const

export const footerLinks = [
	{ label: 'GitHub', href: 'https://github.com/ITBooster-practice/tracker-task' },
	{ label: 'Документация', href: '#' },
	{ label: 'Issues', href: '#' },
	{ label: 'Сообщество', href: '#' },
] as const
