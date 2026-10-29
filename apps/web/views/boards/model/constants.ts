import type { TaskStatus } from '@repo/types'

import type { BoardColumnId, BoardTask, BoardTypeFilter } from './types'

export const BOARD_FILTER_ALL = 'ALL' as const
export const BOARD_COLUMN_CONTAINER_PREFIX = 'board-column'
export const BOARD_COLUMN_ORDER_PREFIX = 'board-column-order'

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
