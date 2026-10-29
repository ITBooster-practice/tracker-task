import {
	createBoardTaskFixture,
	createBoardViewFixture,
} from '@/test/mocks/api/boards.fixtures'
import { describe, expect, it } from 'vitest'

import {
	toBoardCardViewModel,
	toBoardColumnsViewModel,
} from '@/views/boards/model/adapters'
import { moveTaskInColumns } from '@/views/boards/model/utils'

const assignee = { id: 'user-1', name: 'Анна Ким', initials: 'АК' }

describe('board API adapters', () => {
	it('сохраняет доменные поля и добавляет только представление карточки', () => {
		const task = Object.freeze(
			createBoardTaskFixture({
				id: 'task-api',
				type: 'BUG',
				boardColumnId: 'column:custom',
				version: 7,
				position: 3,
				assigneeId: assignee.id,
				description: null,
				dueDate: null,
				createdAt: '2026-04-15T23:30:00.000Z',
			}),
		)
		const card = toBoardCardViewModel(task, [assignee])

		expect(card).toMatchObject(task)
		expect(card.key).toBe(task.id)
		expect(card.assignee).toEqual(assignee)
		expect(card.createdAtLabel).toMatch(/15.*2026/)
		expect(card.tags).toEqual([])
		expect(card.comments).toEqual([])
		expect(card.history).toEqual([])
		expect(card.checklist).toBeUndefined()
	})

	it('различает неназначенную задачу и исполнителя без загруженного профиля', () => {
		const unassigned = toBoardCardViewModel(
			createBoardTaskFixture({ assigneeId: null }),
			[assignee],
		)
		const unknown = toBoardCardViewModel(
			createBoardTaskFixture({ assigneeId: 'unloaded-user' }),
			[assignee],
		)

		expect(unassigned.assignee).toBeNull()
		expect(unassigned.assigneeId).toBeNull()
		expect(unknown.assigneeId).toBe('unloaded-user')
		expect(unknown.assignee).toEqual({
			id: 'unloaded-user',
			name: 'Неизвестный пользователь',
			initials: '?',
		})
	})

	it('сохраняет произвольные ID, ключи, порядок и метаданные колонок из API', () => {
		const view = createBoardViewFixture()
		view.columns = [
			{
				...view.columns[0]!,
				id: 'column:review',
				key: 'IN_REVIEW',
				title: 'Проверяем',
				position: 0,
				tasks: [
					createBoardTaskFixture({
						id: 'unassigned',
						assigneeId: null,
						boardColumnId: 'column:review',
						status: 'IN_REVIEW',
					}),
				],
			},
			{
				...view.columns[0]!,
				id: 'custom-done',
				key: 'DONE',
				title: 'Завершили',
				position: 1,
				tasks: [
					createBoardTaskFixture({
						id: 'assigned',
						assigneeId: assignee.id,
						boardColumnId: 'custom-done',
						status: 'DONE',
					}),
				],
			},
			{
				...view.columns[0]!,
				id: 'custom-empty',
				key: 'EXTERNAL',
				title: 'Ожидание',
				position: 2,
				tasks: [],
			},
		]
		const original = structuredClone(view)
		const columns = toBoardColumnsViewModel(view, [assignee])

		expect(columns.map((column) => column.id)).toEqual([
			'column:review',
			'custom-done',
			'custom-empty',
		])
		for (const [index, column] of columns.entries()) {
			expect(column).toMatchObject(view.columns[index]!)
		}
		expect(columns[2]!.tasks).toEqual([])
		const moved = moveTaskInColumns(columns, {
			taskId: 'unassigned',
			toColumnId: 'custom-empty',
			toIndex: 0,
		})
		expect(moved[2]!.tasks[0]!.boardColumnId).toBe('custom-empty')
		expect(view).toEqual(original)
		expect(columns[0]!.tasks[0]!.boardColumnId).toBe('column:review')
	})
})
