import {
	createBoardTaskFixture as createApiBoardTaskFixture,
	createBoardViewFixture,
} from '@/test/mocks/api/boards.fixtures'

import type { BoardAssignee, BoardColumn, BoardTask } from '@/views/boards/model/types'

export const boardTestAssignee: BoardAssignee = {
	id: 'alexey',
	name: 'Алексей Морозов',
	initials: 'AM',
}

export function createBoardTaskFixture(overrides: Partial<BoardTask> = {}): BoardTask {
	return {
		...createApiBoardTaskFixture({ assigneeId: boardTestAssignee.id }),
		id: 'task-a',
		key: 'TT-1',
		title: 'Проверить карточку задачи',
		type: 'TASK',
		priority: 'HIGH',
		boardColumnId: 'TODO',
		assignee: boardTestAssignee,
		dueDate: '2026-05-01T00:00:00.000Z',
		...overrides,
	}
}

export function createBoardColumnFixture(
	overrides: Partial<BoardColumn> = {},
): BoardColumn {
	return {
		...createBoardViewFixture().columns[0]!,
		id: 'TODO',
		title: 'К выполнению',
		tasks: [
			createBoardTaskFixture(),
			createBoardTaskFixture({
				id: 'task-b',
				key: 'TT-2',
				title: 'Вторая карточка',
			}),
		],
		...overrides,
	}
}

export function createBoardColumnsFixture(): BoardColumn[] {
	return [
		createBoardColumnFixture(),
		createBoardColumnFixture({
			id: 'DONE',
			key: 'DONE',
			position: 1,
			title: 'Готово',
			tasks: [
				createBoardTaskFixture({
					id: 'task-done',
					key: 'TT-3',
					title: 'Готовая карточка',
					boardColumnId: 'DONE',
					status: 'DONE',
				}),
			],
		}),
	]
}
