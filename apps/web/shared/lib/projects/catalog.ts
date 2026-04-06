import { teamRoutes } from '@/shared/config'

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

const PROJECT_ID_MAX_LENGTH = 48
const PROJECT_ID_FALLBACK_PREFIX = 'project'
const PROJECT_ID_DUPLICATE_SUFFIX_START = 2

const CYRILLIC_TO_LATIN_MAP: Record<string, string> = {
	а: 'a',
	б: 'b',
	в: 'v',
	г: 'g',
	д: 'd',
	е: 'e',
	ё: 'e',
	ж: 'zh',
	з: 'z',
	и: 'i',
	й: 'y',
	к: 'k',
	л: 'l',
	м: 'm',
	н: 'n',
	о: 'o',
	п: 'p',
	р: 'r',
	с: 's',
	т: 't',
	у: 'u',
	ф: 'f',
	х: 'h',
	ц: 'ts',
	ч: 'ch',
	ш: 'sh',
	щ: 'sch',
	ъ: '',
	ы: 'y',
	ь: '',
	э: 'e',
	ю: 'yu',
	я: 'ya',
}

function isProjectNameSeparator(char: string) {
	return char === '-' || char === '_'
}

function isAllowedProjectIdChar(char: string) {
	const codePoint = char.codePointAt(0)

	if (codePoint === undefined) {
		return false
	}

	const isDigit = codePoint >= 48 && codePoint <= 57
	const isLatinLowercaseLetter = codePoint >= 97 && codePoint <= 122
	const isCyrillicLowercaseLetter = codePoint >= 1072 && codePoint <= 1103
	const isYoLetter = codePoint === 1105

	return isDigit || isLatinLowercaseLetter || isCyrillicLowercaseLetter || isYoLetter
}

function transliterateCyrillic(value: string) {
	let result = ''

	for (const char of value.toLowerCase()) {
		result += CYRILLIC_TO_LATIN_MAP[char] ?? char
	}

	return result
}

function splitProjectIdParts(projectId: string) {
	const parts: string[] = []
	let currentPart = ''

	for (const char of decodeURIComponent(projectId)) {
		if (isProjectNameSeparator(char)) {
			if (currentPart) {
				parts.push(currentPart)
				currentPart = ''
			}
			continue
		}

		currentPart += char
	}

	if (currentPart) {
		parts.push(currentPart)
	}

	return parts
}

function normalizeProjectSlug(name: string) {
	let normalizedId = ''
	let hasPendingSeparator = false

	for (const char of transliterateCyrillic(name).trim()) {
		if (isAllowedProjectIdChar(char)) {
			normalizedId += char
			hasPendingSeparator = false
			continue
		}

		if (!normalizedId || hasPendingSeparator) {
			continue
		}

		normalizedId += '-'
		hasPendingSeparator = true
	}

	if (normalizedId.endsWith('-')) {
		normalizedId = normalizedId.slice(0, -1)
	}

	return normalizedId.slice(0, PROJECT_ID_MAX_LENGTH)
}

export function normalizeProjectId(name: string) {
	const normalizedSlug = normalizeProjectSlug(name)

	return normalizedSlug.replaceAll('-', '_').toUpperCase()
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

	return teamRoutes.project(teamId, projectId)
}

export function getProjectById(projectId: string) {
	return projectCatalog.find((project) => project.id === projectId)
}

export function formatProjectNameFromId(projectId: string) {
	return splitProjectIdParts(projectId)
		.map((part) => {
			const normalizedPart = part.toLowerCase()

			return normalizedPart[0]?.toUpperCase() + normalizedPart.slice(1)
		})
		.join(' ')
}

export function createProjectId(name: string, existingIds: string[]) {
	const baseId = normalizeProjectSlug(name)

	if (!baseId) {
		return `${PROJECT_ID_FALLBACK_PREFIX}-${existingIds.length + 1}`
	}

	if (!existingIds.includes(baseId)) {
		return baseId
	}

	let suffix = PROJECT_ID_DUPLICATE_SUFFIX_START
	let nextId = `${baseId}-${suffix}`

	while (existingIds.includes(nextId)) {
		suffix += 1
		nextId = `${baseId}-${suffix}`
	}

	return nextId
}
