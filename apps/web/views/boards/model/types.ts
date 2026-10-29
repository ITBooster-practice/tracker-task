import type {
	BoardColumn as ApiBoardColumn,
	BoardTask as ApiBoardTask,
	BoardColumnWithTasks,
	MoveTaskToColumn,
	Priority,
	TaskType,
} from '@repo/types'

export type BoardColumnId = ApiBoardColumn['id']

export type BoardTypeFilter = 'ALL' | TaskType

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
