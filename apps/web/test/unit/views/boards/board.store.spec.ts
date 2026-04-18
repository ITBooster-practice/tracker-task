import { beforeEach, describe, expect, it } from 'vitest'

import { useBoardStore } from '@/views/boards/model/store'
import {
	filterBoardColumns,
	findBoardTask,
	moveTaskInColumns,
} from '@/views/boards/model/utils'

describe('board store', () => {
	beforeEach(() => {
		useBoardStore.getState().resetBoard()
	})

	it('moveTaskInColumns переносит карточку между колонками и обновляет её статус', () => {
		const initialColumns = useBoardStore.getState().columns
		const nextColumns = moveTaskInColumns(initialColumns, {
			taskId: 'task-105',
			toColumnId: 'DONE',
			toIndex: 1,
		})

		const doneColumn = nextColumns.find((column) => column.id === 'DONE')
		const movedTask = doneColumn?.tasks.find((task) => task.id === 'task-105')

		expect(doneColumn?.tasks.map((task) => task.id)).toContain('task-105')
		expect(movedTask?.columnId).toBe('DONE')
	})

	it('submitComment добавляет комментарий и запись в историю', () => {
		const store = useBoardStore.getState()

		store.openTask('task-106')
		store.setCommentDraft('Новый комментарий для проверки store')
		store.submitComment()

		const updatedTask = useBoardStore
			.getState()
			.columns.flatMap((column) => column.tasks)
			.find((task) => task.id === 'task-106')

		expect(updatedTask?.comments.at(-1)?.content).toBe(
			'Новый комментарий для проверки store',
		)
		expect(updatedTask?.history[0]?.action).toBe('Добавил комментарий к задаче')
		expect(useBoardStore.getState().commentDraft).toBe('')
	})

	it('filterBoardColumns фильтрует карточки по поиску и исполнителю', () => {
		const columns = useBoardStore.getState().columns
		const filteredColumns = filterBoardColumns(columns, {
			query: 'drag preview',
			type: 'ALL',
			assignee: 'anna',
		})

		const visibleTaskIds = filteredColumns.flatMap((column) =>
			column.tasks.map((task) => task.id),
		)

		expect(visibleTaskIds).toEqual(['task-105'])
	})

	it('resetFilters возвращает значения фильтров по умолчанию', () => {
		useBoardStore.setState({
			query: 'review',
			type: 'Баг',
			assignee: 'denis',
		})

		useBoardStore.getState().resetFilters()

		const state = useBoardStore.getState()

		expect(state.query).toBe('')
		expect(state.type).toBe('ALL')
		expect(state.assignee).toBe('ALL')
	})

	it('submitComment с пустым draft не меняет задачу', () => {
		const initialTask = useBoardStore
			.getState()
			.columns.flatMap((column) => column.tasks)
			.find((task) => task.id === 'task-106')

		useBoardStore.getState().openTask('task-106')
		useBoardStore.getState().submitComment()

		const currentTask = useBoardStore
			.getState()
			.columns.flatMap((column) => column.tasks)
			.find((task) => task.id === 'task-106')

		expect(currentTask?.comments).toHaveLength(initialTask?.comments.length ?? 0)
		expect(currentTask?.history).toHaveLength(initialTask?.history.length ?? 0)
	})

	it('createTask добавляет новую задачу в выбранную колонку', () => {
		useBoardStore.getState().createTask({
			title: 'Новая задача',
			description: 'Описание новой задачи',
			columnId: 'TODO',
			priority: 'HIGH',
			assigneeId: 'anna',
			deadline: '2026-05-01',
			tags: ['feature', 'board'],
		})

		const state = useBoardStore.getState()
		const todoColumn = state.columns.find((column) => column.id === 'TODO')
		const createdTask = todoColumn?.tasks.at(-1)

		expect(createdTask).toMatchObject({
			title: 'Новая задача',
			description: 'Описание новой задачи',
			columnId: 'TODO',
			priority: 'HIGH',
			deadline: '2026-05-01',
			tags: ['feature', 'board'],
		})
		expect(createdTask?.assignee.id).toBe('anna')
		expect(createdTask?.key).toBe('SPR-110')
	})

	it('updateTask обновляет поля и переносит задачу при смене статуса', () => {
		useBoardStore.getState().updateTask('task-103', {
			title: 'Обновлённая задача',
			description: 'Новое описание',
			columnId: 'IN_REVIEW',
			priority: 'CRITICAL',
			assigneeId: 'denis',
			deadline: '2026-05-02',
			tags: ['review'],
		})

		const state = useBoardStore.getState()
		const updatedTask = findBoardTask(state.columns, 'task-103')
		const oldColumnTaskIds =
			state.columns
				.find((column) => column.id === 'TODO')
				?.tasks.map((task) => task.id) ?? []

		expect(oldColumnTaskIds).not.toContain('task-103')
		expect(updatedTask).toMatchObject({
			title: 'Обновлённая задача',
			description: 'Новое описание',
			columnId: 'IN_REVIEW',
			priority: 'CRITICAL',
			deadline: '2026-05-02',
			tags: ['review'],
		})
		expect(updatedTask?.assignee.id).toBe('denis')
	})

	it('deleteTask удаляет задачу и закрывает её детали', () => {
		useBoardStore.getState().openTask('task-106')
		useBoardStore.getState().deleteTask('task-106')

		const state = useBoardStore.getState()

		expect(findBoardTask(state.columns, 'task-106')).toBeNull()
		expect(state.openedTaskId).toBeNull()
	})
})
