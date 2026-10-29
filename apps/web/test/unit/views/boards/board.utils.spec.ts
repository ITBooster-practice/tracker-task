import { createBoardColumnsFixture } from '@/test/mocks/views/boards/board-ui.fixtures'
import { describe, expect, it } from 'vitest'

import { findBoardTask, moveTaskInColumns } from '@/views/boards/model/utils'

describe('board utils', () => {
	it('переставляет задачу внутри колонки, не меняя исходные данные', () => {
		const columns = createBoardColumnsFixture()
		const original = structuredClone(columns)
		const next = moveTaskInColumns(columns, {
			taskId: 'task-b',
			toColumnId: 'TODO',
			toIndex: 0,
		})

		expect(next[0]!.tasks.map((task) => task.id)).toEqual(['task-b', 'task-a'])
		expect(columns).toEqual(original)
	})

	it('возвращает исходную ссылку для отсутствующей задачи или колонки', () => {
		const columns = createBoardColumnsFixture()
		expect(
			moveTaskInColumns(columns, {
				taskId: 'missing-task',
				toColumnId: 'DONE',
				toIndex: 0,
			}),
		).toBe(columns)
		expect(
			moveTaskInColumns(columns, {
				taskId: 'task-a',
				toColumnId: 'missing-column',
				toIndex: 0,
			}),
		).toBe(columns)
	})

	it('находит задачу по id и возвращает null для отсутствующей', () => {
		const columns = createBoardColumnsFixture()
		expect(findBoardTask(columns, 'task-done')?.key).toBe('TT-3')
		expect(findBoardTask(columns, 'missing-task')).toBeNull()
		expect(findBoardTask(columns, null)).toBeNull()
	})
})
