export type ProjectCatalogItem = {
	id: string
	code: string
	name: string
	description: string
	boardsCount: number
	tasksCount: number
}

export const projectCatalog: ProjectCatalogItem[] = [
	{
		id: 'tracker-task',
		code: 'TT',
		name: 'Tracker Task',
		description: 'Основной продукт — трекер задач',
		boardsCount: 2,
		tasksCount: 24,
	},
	{
		id: 'marketing-site',
		code: 'MS',
		name: 'Marketing Site',
		description: 'Лендинг и маркетинговые страницы',
		boardsCount: 1,
		tasksCount: 12,
	},
	{
		id: 'mobile-app',
		code: 'MA',
		name: 'Mobile App',
		description: 'Мобильное приложение трекера',
		boardsCount: 1,
		tasksCount: 8,
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
