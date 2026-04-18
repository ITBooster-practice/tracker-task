import { beforeEach, describe, expect, it } from 'vitest'

import { boardMock } from '@/views/boards/model/mock-data'
import { useBoardStore } from '@/views/boards/model/store'
import {
	buildBoardAssigneeOptions,
	buildBoardStats,
	findBoardTask,
	hasBoardActiveFilters,
	moveTaskInColumns,
} from '@/views/boards/model/utils'

describe('board utils', () => {
	beforeEach(() => {
		useBoardStore.getState().resetBoard()
	})

	it('moveTaskInColumns переставляет задачу внутри той же колонки', () => {
		const initialColumns = useBoardStore.getState().columns
		const nextColumns = moveTaskInColumns(initialColumns, {
			taskId: 'task-102',
			toColumnId: 'BACKLOG',
			toIndex: 0,
		})

		const backlogTaskIds =
			nextColumns
				.find((column) => column.id === 'BACKLOG')
				?.tasks.map((task) => task.id) ?? []

		expect(backlogTaskIds).toEqual(['task-102', 'task-101'])
	})

	it('moveTaskInColumns возвращает исходную ссылку для неизвестной задачи', () => {
		const initialColumns = useBoardStore.getState().columns
		const nextColumns = moveTaskInColumns(initialColumns, {
			taskId: 'task-missing',
			toColumnId: 'DONE',
			toIndex: 0,
		})

		expect(nextColumns).toBe(initialColumns)
	})

	it('buildBoardAssigneeOptions добавляет "Все исполнители" и убирает дубликаты', () => {
		const options = buildBoardAssigneeOptions(
			boardMock.columns.flatMap((column) => column.tasks),
		)

		expect(options[0]).toEqual({
			label: 'Все исполнители',
			value: 'ALL',
		})
		expect(options.map((option) => option.value)).toEqual([
			'ALL',
			'anna',
			'alexey',
			'maria',
			'denis',
		])
	})

	it('hasBoardActiveFilters корректно определяет активные фильтры', () => {
		expect(
			hasBoardActiveFilters({
				query: '',
				type: 'ALL',
				assignee: 'ALL',
			}),
		).toBe(false)

		expect(
			hasBoardActiveFilters({
				query: ' review ',
				type: 'ALL',
				assignee: 'ALL',
			}),
		).toBe(true)

		expect(
			hasBoardActiveFilters({
				query: '',
				type: 'Баг',
				assignee: 'ALL',
			}),
		).toBe(true)
	})

	it('findBoardTask находит задачу по id и возвращает null для отсутствующей', () => {
		const columns = useBoardStore.getState().columns

		expect(findBoardTask(columns, 'task-105')?.key).toBe('SPR-105')
		expect(findBoardTask(columns, 'missing-task')).toBeNull()
		expect(findBoardTask(columns, null)).toBeNull()
	})

	it('buildBoardStats считает прогресс и ключевые статусы', () => {
		const stats = buildBoardStats(useBoardStore.getState().columns)

		expect(stats).toEqual([
			{
				label: 'Прогресс',
				value: '22%',
				helper: '2 из 9 задач завершены',
			},
			{
				label: 'В работе',
				value: '2',
				helper: 'Карточки, над которыми команда работает сейчас',
			},
			{
				label: 'На ревью',
				value: '1',
				helper: 'Финальная проверка перед закрытием',
			},
		])
	})
})
