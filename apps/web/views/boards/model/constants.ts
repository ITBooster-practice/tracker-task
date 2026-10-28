import type { TaskStatus } from '@repo/types'

import type { BoardColumn, BoardColumnId, BoardTask, BoardTypeFilter } from './types'

export const BOARD_FILTER_ALL = 'ALL' as const
export const BOARD_RECENT_LABEL = 'Только что'
export const BOARD_COLUMN_CONTAINER_PREFIX = 'board-column'
export const BOARD_ASSIGNEE_ALL_OPTION_LABEL = 'Все исполнители'

export const BOARD_PRIORITY_LABELS: Record<BoardTask['priority'], string> = {
	LOW: 'Низкий',
	MEDIUM: 'Средний',
	HIGH: 'Высокий',
	CRITICAL: 'Критичный',
}

export const BOARD_COLUMN_TITLES: Record<TaskStatus, string> = {
	BACKLOG: 'Бэклог',
	TODO: 'К выполнению',
	IN_PROGRESS: 'В работе',
	IN_REVIEW: 'На ревью',
	DONE: 'Готово',
}

const BOARD_COLUMN_DEFINITIONS: Array<{
	id: TaskStatus
	title: string
	description: string
}> = [
	{
		id: 'BACKLOG',
		title: BOARD_COLUMN_TITLES.BACKLOG,
		description: 'Идеи и задачи, которые ещё не взяли в работу.',
	},
	{
		id: 'TODO',
		title: BOARD_COLUMN_TITLES.TODO,
		description: 'Готово к старту и ждёт ближайшего окна в спринте.',
	},
	{
		id: 'IN_PROGRESS',
		title: BOARD_COLUMN_TITLES.IN_PROGRESS,
		description: 'Активные задачи команды прямо сейчас.',
	},
	{
		id: 'IN_REVIEW',
		title: BOARD_COLUMN_TITLES.IN_REVIEW,
		description: 'Проверка качества перед закрытием.',
	},
	{
		id: 'DONE',
		title: BOARD_COLUMN_TITLES.DONE,
		description: 'Завершённые задачи текущего спринта.',
	},
]

export const BOARD_COLUMNS: Array<Omit<BoardColumn, 'tasks'> & { key: TaskStatus }> =
	BOARD_COLUMN_DEFINITIONS.map((column, position) => ({
		...column,
		key: column.id,
		position,
		boardId: 'board-24',
		projectId: 'project-demo',
		isSystem: true,
		createdAt: '2026-04-15T00:00:00.000Z',
		updatedAt: '2026-04-15T00:00:00.000Z',
	}))

export const BOARD_TYPE_OPTIONS: Array<{
	label: string
	value: BoardTypeFilter
}> = [
	{ label: 'Все типы', value: BOARD_FILTER_ALL },
	{ label: 'Эпики', value: 'EPIC' },
	{ label: 'Стори', value: 'STORY' },
	{ label: 'Задачи', value: 'TASK' },
	{ label: 'Баги', value: 'BUG' },
	{ label: 'Тех. долг', value: 'TECH_DEBT' },
]

export const getBoardColumnContainerId = (boardColumnId: BoardColumnId) =>
	`${BOARD_COLUMN_CONTAINER_PREFIX}:${boardColumnId}`
