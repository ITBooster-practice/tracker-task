import type { BoardTask, BoardView } from '@repo/types'

import { createTaskFixture } from './tasks.fixtures'

export function createBoardTaskFixture(overrides?: Partial<BoardTask>): BoardTask {
	return {
		...createTaskFixture(),
		boardColumnId: 'board-1-column',
		createdById: 'user-1',
		...overrides,
	}
}

export function createBoardViewFixture(
	boardId = 'board-1',
	projectId = 'project-1',
): BoardView {
	const timestamp = '2026-01-01T00:00:00.000Z'
	const columnId = `${boardId}-column`
	return {
		board: {
			id: boardId,
			projectId,
			name: 'Board',
			isDefault: false,
			createdAt: timestamp,
			updatedAt: timestamp,
		},
		columns: [
			{
				id: columnId,
				boardId,
				projectId,
				key: 'TODO',
				title: 'To do',
				position: 0,
				isSystem: false,
				createdAt: timestamp,
				updatedAt: timestamp,
				tasks: [createBoardTaskFixture({ boardColumnId: columnId, projectId })],
			},
		],
	}
}
