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
