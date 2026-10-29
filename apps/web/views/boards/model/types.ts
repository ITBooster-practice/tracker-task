import type {
	BoardColumn as ApiBoardColumn,
	BoardTask as ApiBoardTask,
	Board,
	BoardColumnWithTasks,
	MoveTaskToColumn,
	Priority,
	TaskType,
} from '@repo/types'

export type BoardColumnId = ApiBoardColumn['id']

export type BoardTypeFilter = 'ALL' | TaskType
export type BoardAssigneeFilter = 'ALL' | string

export interface BoardAssignee {
	id: string
	name: string
	initials: string
}

export interface BoardChecklist {
	completed: number
	total: number
}

export interface BoardComment {
	id: string
	author: BoardAssignee
	content: string
	createdAtLabel: string
}

export interface BoardHistoryEntry {
	id: string
	action: string
	actor?: BoardAssignee | null
	createdAtLabel: string
}

export interface BoardTask extends ApiBoardTask {
	key: string
	tags: string[]
	assignee: BoardAssignee | null
	checklist?: BoardChecklist
	comments: BoardComment[]
	history: BoardHistoryEntry[]
	createdAtLabel: string
}

export interface BoardColumn extends Omit<BoardColumnWithTasks, 'tasks'> {
	description?: string
	tasks: BoardTask[]
}

export interface BoardInfo extends Board {
	projectName: string
	periodLabel: string
	goal: string
}

export interface BoardFilters {
	query: string
	type: BoardTypeFilter
	assignee: BoardAssigneeFilter
}

export interface BoardTaskMoveInput extends Pick<
	MoveTaskToColumn,
	'priority' | 'assigneeId'
> {
	taskId: string
	toColumnId: BoardColumnId
	toIndex: number
}

export interface BoardTaskFormValues {
	title: string
	type?: TaskType
	description: string
	boardColumnId: BoardColumnId
	priority: Priority
	assigneeId: string
	dueDate: string
	tags: string[]
}

export interface BoardStat {
	label: string
	value: string
	helper: string
}
