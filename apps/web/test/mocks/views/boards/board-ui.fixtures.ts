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
		description: 'Описание задачи для unit-теста board UI.',
		type: 'TASK',
		priority: 'HIGH',
		boardColumnId: 'TODO',
		tags: ['ui', 'tests'],
		assignee: boardTestAssignee,
		dueDate: '2026-05-01T00:00:00.000Z',
		checklist: { completed: 1, total: 3 },
		comments: [
			{
				id: 'comment-a',
				author: boardTestAssignee,
				content: 'Первый комментарий',
				createdAtLabel: 'Сегодня, 10:00',
			},
		],
		history: [
			{
				id: 'history-a',
				action: 'Задача создана',
				actor: boardTestAssignee,
				createdAtLabel: 'Сегодня, 09:00',
			},
		],
		createdAtLabel: 'Сегодня, 08:30',
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
		description: 'Готово к старту.',
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
			description: 'Завершённые задачи.',
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
