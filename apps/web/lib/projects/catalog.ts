export type ProjectCatalogItem = {
	id: string
	code: string
	name: string
	description: string
	boardsCount: number
	tasksCount: number
	boards: Array<{
		id: string
		name: string
		columnCount: number
	}>
	recentTasks: Array<{
		id: string
		key: string
		title: string
		assigneeInitials: string
	}>
}

export const projectCatalog: ProjectCatalogItem[] = [
	{
		id: 'tracker-task',
		code: 'TT',
		name: 'Tracker Task',
		description: 'Основной продукт — трекер задач',
		boardsCount: 2,
		tasksCount: 24,
		boards: [
			{
				id: 'sprint-board',
				name: 'Sprint Board',
				columnCount: 5,
			},
			{
				id: 'bug-tracking',
				name: 'Bug Tracking',
				columnCount: 5,
			},
		],
		recentTasks: [
			{
				id: 'tt-1',
				key: 'TT-1',
				title: 'Реализовать систему авторизации',
				assigneeInitials: 'AI',
			},
			{
				id: 'tt-2',
				key: 'TT-2',
				title: 'Kanban доска с drag & drop',
				assigneeInitials: 'МП',
			},
			{
				id: 'tt-3',
				key: 'TT-3',
				title: 'Фильтры и поиск задач',
				assigneeInitials: 'ДК',
			},
			{
				id: 'tt-4',
				key: 'TT-4',
				title: 'Исправить баг с отображением аватаров',
				assigneeInitials: 'ЕС',
			},
		],
	},
	{
		id: 'marketing-site',
		code: 'MS',
		name: 'Marketing Site',
		description: 'Лендинг и маркетинговые страницы',
		boardsCount: 1,
		tasksCount: 12,
		boards: [
			{
				id: 'content-board',
				name: 'Content Board',
				columnCount: 4,
			},
		],
		recentTasks: [
			{
				id: 'ms-1',
				key: 'MS-1',
				title: 'Подготовить hero-блок лендинга',
				assigneeInitials: 'АЛ',
			},
			{
				id: 'ms-2',
				key: 'MS-2',
				title: 'Обновить SEO-метаданные',
				assigneeInitials: 'ЕК',
			},
			{
				id: 'ms-3',
				key: 'MS-3',
				title: 'Сверстать страницу тарифа',
				assigneeInitials: 'МН',
			},
		],
	},
	{
		id: 'mobile-app',
		code: 'MA',
		name: 'Mobile App',
		description: 'Мобильное приложение трекера',
		boardsCount: 1,
		tasksCount: 8,
		boards: [
			{
				id: 'mobile-roadmap',
				name: 'Mobile Roadmap',
				columnCount: 4,
			},
		],
		recentTasks: [
			{
				id: 'ma-1',
				key: 'MA-1',
				title: 'Собрать экран onboarding',
				assigneeInitials: 'ИЛ',
			},
			{
				id: 'ma-2',
				key: 'MA-2',
				title: 'Настроить пуш-уведомления',
				assigneeInitials: 'ПН',
			},
		],
	},
]

export function buildTeamProjectHref(
	teamId: string | null | undefined,
	projectId: string | null | undefined,
) {
	if (!teamId || !projectId) {
		return '#'
	}

	return `/teams/${encodeURIComponent(teamId)}/projects/${encodeURIComponent(projectId)}`
}

export function getProjectById(projectId: string) {
	return projectCatalog.find((project) => project.id === projectId) ?? null
}

export function formatProjectNameFromId(projectId: string) {
	return decodeURIComponent(projectId)
		.split(/[-_]+/)
		.filter(Boolean)
		.map((part) => part[0]?.toUpperCase() + part.slice(1))
		.join(' ')
}

export function createProjectId(name: string, existingIds: string[]) {
	const baseId = name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9а-яё]+/giu, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 48)

	if (!baseId) {
		return `project-${existingIds.length + 1}`
	}

	if (!existingIds.includes(baseId)) {
		return baseId
	}

	let suffix = 2
	let nextId = `${baseId}-${suffix}`

	while (existingIds.includes(nextId)) {
		suffix += 1
		nextId = `${baseId}-${suffix}`
	}

	return nextId
}
