import type { BoardColumnColor } from '../schemas/board.schema'

export interface Board {
	id: string
	projectId: string
	name: string
	description: string | null
	isDefault: boolean
	archivedAt: string | null
	createdAt: string
	updatedAt: string
}

export interface BoardColumn {
	id: string
	boardId: string
	projectId: string
	key: string
	title: string
	color: BoardColumnColor
	position: number
	isSystem: boolean
	createdAt: string
	updatedAt: string
}

export interface BoardListItem extends Board {
	columns: BoardColumn[]
	taskCount: number
}
import type { Task } from '../../tasks/types/task.types'

export type BoardTask = Task

export interface BoardColumnWithTasks extends BoardColumn {
	tasks: BoardTask[]
}

export interface BoardView {
	board: Board
	columns: BoardColumnWithTasks[]
}
