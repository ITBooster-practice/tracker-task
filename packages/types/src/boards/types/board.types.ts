export interface Board {
	id: string
	projectId: string
	name: string
	isDefault: boolean
	createdAt: string
	updatedAt: string
}

export interface BoardColumn {
	id: string
	boardId: string
	projectId: string
	key: string
	title: string
	position: number
	isSystem: boolean
	createdAt: string
	updatedAt: string
}

export interface BoardListItem extends Board {
	columns: BoardColumn[]
}
import type { Task } from '../../tasks/types/task.types'

export interface BoardTask extends Task {
	boardColumnId: string
	createdById: string
}

export interface BoardColumnWithTasks extends BoardColumn {
	tasks: BoardTask[]
}

export interface BoardView {
	board: Board
	columns: BoardColumnWithTasks[]
}
