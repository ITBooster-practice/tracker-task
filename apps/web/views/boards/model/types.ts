import type { TaskPriority, TaskType } from '@/entities/task'

export type BoardColumnId = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'

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

export interface BoardTask {
	id: string
	key: string
	title: string
	description: string
	type: TaskType
	priority: TaskPriority
	columnId: BoardColumnId
	tags: string[]
	assignee: BoardAssignee
	deadline: string
	checklist?: BoardChecklist
	comments: BoardComment[]
	history: BoardHistoryEntry[]
	createdAtLabel: string
}

export interface BoardColumn {
	id: BoardColumnId
	title: string
	description: string
	tasks: BoardTask[]
}

export interface BoardInfo {
	id: string
	name: string
	projectName: string
	periodLabel: string
	goal: string
}

export interface BoardFilters {
	query: string
	type: BoardTypeFilter
	assignee: BoardAssigneeFilter
}

export interface BoardTaskMoveInput {
	taskId: string
	toColumnId: BoardColumnId
	toIndex: number
}

export interface BoardTaskFormValues {
	title: string
	description: string
	columnId: BoardColumnId
	priority: TaskPriority
	assigneeId: string
	deadline: string
	tags: string[]
}

export interface BoardStat {
	label: string
	value: string
	helper: string
}
