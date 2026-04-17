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

export const BOARD_COLUMN_TITLES: Record<BoardColumnId, string> = {
	BACKLOG: 'Бэклог',
	TODO: 'К выполнению',
	IN_PROGRESS: 'В работе',
	IN_REVIEW: 'На ревью',
	DONE: 'Готово',
}

export const BOARD_COLUMNS: Array<Omit<BoardColumn, 'tasks'>> = [
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

export const BOARD_TYPE_OPTIONS: Array<{
	label: string
	value: BoardTypeFilter
}> = [
	{ label: 'Все типы', value: BOARD_FILTER_ALL },
	{ label: 'Эпики', value: 'Эпик' },
	{ label: 'Стори', value: 'Стори' },
	{ label: 'Задачи', value: 'Задача' },
	{ label: 'Баги', value: 'Баг' },
	{ label: 'Тех. долг', value: 'Тех. долг' },
]

export const getBoardColumnContainerId = (columnId: BoardColumnId) =>
	`${BOARD_COLUMN_CONTAINER_PREFIX}:${columnId}`
