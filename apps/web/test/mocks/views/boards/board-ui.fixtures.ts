import type { BoardAssignee, BoardColumn, BoardTask } from '@/views/boards/model/types'

export const boardTestAssignee: BoardAssignee = {
	id: 'alexey',
	name: 'Алексей Морозов',
	initials: 'AM',
}

export function createBoardTaskFixture(overrides: Partial<BoardTask> = {}): BoardTask {
	return {
		id: 'task-a',
		key: 'TT-1',
		title: 'Проверить карточку задачи',
		description: 'Описание задачи для unit-теста board UI.',
		type: 'Задача',
		priority: 'HIGH',
		columnId: 'TODO',
		tags: ['ui', 'tests'],
		assignee: boardTestAssignee,
		deadline: '2026-05-01',
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
			title: 'Готово',
			description: 'Завершённые задачи.',
			tasks: [
				createBoardTaskFixture({
					id: 'task-done',
					key: 'TT-3',
					title: 'Готовая карточка',
					columnId: 'DONE',
				}),
			],
		}),
	]
}
