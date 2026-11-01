import type {
	BoardColumn as ApiBoardColumn,
	BoardTask as ApiBoardTask,
	BoardColumnWithTasks,
	MoveTaskToColumn,
	TaskType,
} from '@repo/types'

export type BoardColumnId = ApiBoardColumn['id']

export type BoardTypeFilter = 'ALL' | TaskType

export interface BoardAssignee {
	id: string
	name: string
	initials: string
}

export interface BoardTask extends ApiBoardTask {
	key: string
	assignee: BoardAssignee | null
}

export interface BoardColumn extends Omit<BoardColumnWithTasks, 'tasks'> {
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
