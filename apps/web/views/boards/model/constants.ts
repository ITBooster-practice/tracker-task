import type { BoardColumnId, BoardTask, BoardTypeFilter } from './types'

export const BOARD_FILTER_ALL = 'ALL' as const
export const BOARD_COLUMN_CONTAINER_PREFIX = 'board-column'

export const BOARD_PRIORITY_LABELS: Record<BoardTask['priority'], string> = {
	LOW: 'Низкий',
	MEDIUM: 'Средний',
	HIGH: 'Высокий',
	CRITICAL: 'Критический',
}

export const BOARD_TYPE_OPTIONS: Array<{
	label: string
	value: BoardTypeFilter
}> = [
	{ label: 'Все типы', value: BOARD_FILTER_ALL },
	{ label: 'Задача', value: 'TASK' },
	{ label: 'Баг', value: 'BUG' },
	{ label: 'История', value: 'STORY' },
	{ label: 'Эпик', value: 'EPIC' },
	{ label: 'Техдолг', value: 'TECH_DEBT' },
]

export const getBoardColumnContainerId = (boardColumnId: BoardColumnId) =>
	`${BOARD_COLUMN_CONTAINER_PREFIX}:${boardColumnId}`
