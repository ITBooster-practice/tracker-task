import { create } from 'zustand'

import { BOARD_FILTER_ALL, BOARD_RECENT_LABEL } from './constants'
import { boardMock } from './mock-data'
import type {
	BoardAssignee,
	BoardAssigneeFilter,
	BoardColumn,
	BoardColumnId,
	BoardInfo,
	BoardTask,
	BoardTaskFormValues,
	BoardTaskMoveInput,
	BoardTypeFilter,
} from './types'
import {
	flattenBoardTasks,
	getBoardColumnTaskStatus,
	moveTaskInColumns,
	updateBoardTask,
} from './utils'

const BOARD_TASK_KEY_PREFIX = 'SPR'
const DEFAULT_TASK_TYPE = 'TASK'

interface BoardStoreState {
	board: BoardInfo
	columns: BoardColumn[]
	query: string
	type: BoardTypeFilter
	assignee: BoardAssigneeFilter
	openedTaskId: string | null
	commentDraft: string
	createTask: (values: BoardTaskFormValues) => void
	deleteTask: (taskId: string) => void
	openTask: (taskId: string) => void
	closeTask: () => void
	moveTask: (input: BoardTaskMoveInput) => void
	resetBoard: () => void
	resetFilters: () => void
	setAssignee: (value: BoardAssigneeFilter) => void
	setCommentDraft: (value: string) => void
	setQuery: (value: string) => void
	setType: (value: BoardTypeFilter) => void
	submitComment: () => void
	updateTask: (taskId: string, values: BoardTaskFormValues) => void
}

const createBoardInitialState = () => ({
	board: structuredClone(boardMock.board),
	columns: structuredClone(boardMock.columns),
	query: '',
	type: BOARD_FILTER_ALL,
	assignee: BOARD_FILTER_ALL,
	openedTaskId: null,
	commentDraft: '',
})

const findAssigneeById = (
	columns: BoardColumn[],
	assigneeId: string,
): BoardAssignee | null =>
	flattenBoardTasks(columns).find((task) => task.assignee?.id === assigneeId)?.assignee ??
	null

const getNextTaskNumber = (columns: BoardColumn[]) =>
	flattenBoardTasks(columns).reduce((maxNumber, task) => {
		const [, rawNumber] = task.key.split('-')
		const taskNumber = Number(rawNumber)

		return Number.isFinite(taskNumber) ? Math.max(maxNumber, taskNumber) : maxNumber
	}, 0) + 1

const createBoardTaskFromValues = (
	columns: BoardColumn[],
	values: BoardTaskFormValues,
): BoardTask | null => {
	const assignee = findAssigneeById(columns, values.assigneeId)

	const column = columns.find((column) => column.id === values.boardColumnId)
	if (!column || (values.assigneeId && !assignee)) {
		return null
	}

	const taskNumber = getNextTaskNumber(columns)

	return {
		id: `task-${taskNumber}`,
		projectId: column.projectId,
		createdById: boardMock.currentUser.id,
		assigneeId: assignee?.id ?? null,
		status: getBoardColumnTaskStatus(column, 'TODO'),
		position: column.tasks.length,
		version: 0,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		key: `${BOARD_TASK_KEY_PREFIX}-${taskNumber}`,
		title: values.title,
		description: values.description,
		type: DEFAULT_TASK_TYPE,
		priority: values.priority,
		boardColumnId: values.boardColumnId,
		tags: values.tags,
		assignee,
		dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
		comments: [],
		history: [
			{
				id: `history-${Date.now()}`,
				action: 'Задача создана',
				actor: boardMock.currentUser,
				createdAtLabel: BOARD_RECENT_LABEL,
			},
		],
		createdAtLabel: BOARD_RECENT_LABEL,
	}
}

const updateTaskInTargetColumn = (
	columns: BoardColumn[],
	taskId: string,
	targetColumnId: BoardColumnId,
	updater: (task: BoardTask) => BoardTask,
) => {
	if (!columns.some((column) => column.id === targetColumnId)) {
		return columns
	}
	let updatedTask: BoardTask | null = null
	let sourceColumnId: BoardColumnId | null = null

	const columnsWithoutTask = columns.map((column) => {
		const task = column.tasks.find((item) => item.id === taskId)

		if (!task) {
			return column
		}

		sourceColumnId = column.id
		updatedTask = updater(task)

		return {
			...column,
			tasks: column.tasks.filter((item) => item.id !== taskId),
		}
	})

	if (!updatedTask || !sourceColumnId) {
		return columns
	}

	const taskToInsert = updatedTask

	return columnsWithoutTask.map((column) => {
		if (column.id !== targetColumnId) {
			return column
		}

		if (sourceColumnId === targetColumnId) {
			const originalColumn = columns.find((item) => item.id === sourceColumnId)
			const taskIndex =
				originalColumn?.tasks.findIndex((task) => task.id === taskId) ??
				column.tasks.length
			const nextTasks = [...column.tasks]
			nextTasks.splice(taskIndex, 0, taskToInsert)

			return {
				...column,
				tasks: nextTasks,
			}
		}

		return {
			...column,
			tasks: [...column.tasks, taskToInsert],
		}
	})
}

export const useBoardStore = create<BoardStoreState>((set) => ({
	...createBoardInitialState(),
	setQuery: (query) => set({ query }),
	setType: (type) => set({ type }),
	setAssignee: (assignee) => set({ assignee }),
	resetFilters: () =>
		set({
			query: '',
			type: BOARD_FILTER_ALL,
			assignee: BOARD_FILTER_ALL,
		}),
	openTask: (taskId) =>
		set({
			openedTaskId: taskId,
			commentDraft: '',
		}),
	closeTask: () =>
		set({
			openedTaskId: null,
			commentDraft: '',
		}),
	setCommentDraft: (commentDraft) => set({ commentDraft }),
	createTask: (values) =>
		set((state) => {
			const task = createBoardTaskFromValues(state.columns, values)

			if (!task) {
				return state
			}

			return {
				columns: state.columns.map((column) =>
					column.id === values.boardColumnId
						? {
								...column,
								tasks: [...column.tasks, task],
							}
						: column,
				),
			}
		}),
	moveTask: (input) =>
		set((state) => {
			const nextColumns = moveTaskInColumns(state.columns, input)

			if (nextColumns === state.columns) {
				return state
			}

			return {
				columns: nextColumns,
			}
		}),
	submitComment: () =>
		set((state) => {
			const content = state.commentDraft.trim()

			if (!content || !state.openedTaskId) {
				return state
			}

			return {
				columns: updateBoardTask(state.columns, state.openedTaskId, (task) => ({
					...task,
					comments: [
						...task.comments,
						{
							id: `comment-${Date.now()}`,
							author: boardMock.currentUser,
							content,
							createdAtLabel: BOARD_RECENT_LABEL,
						},
					],
					history: [
						{
							id: `history-${Date.now()}`,
							action: 'Добавил комментарий к задаче',
							actor: boardMock.currentUser,
							createdAtLabel: BOARD_RECENT_LABEL,
						},
						...task.history,
					],
				})),
				commentDraft: '',
			}
		}),
	updateTask: (taskId, values) =>
		set((state) => {
			const assignee = findAssigneeById(state.columns, values.assigneeId)
			const column = state.columns.find((column) => column.id === values.boardColumnId)

			if (!column || (values.assigneeId && !assignee)) {
				return state
			}

			const nextColumns = updateTaskInTargetColumn(
				state.columns,
				taskId,
				values.boardColumnId,
				(task) => ({
					...task,
					title: values.title,
					description: values.description,
					priority: values.priority,
					boardColumnId: values.boardColumnId,
					status: getBoardColumnTaskStatus(column, task.status),
					tags: values.tags,
					assignee,
					assigneeId: assignee?.id ?? null,
					dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
					history: [
						{
							id: `history-${Date.now()}`,
							action: 'Задача обновлена',
							actor: boardMock.currentUser,
							createdAtLabel: BOARD_RECENT_LABEL,
						},
						...task.history,
					],
				}),
			)

			if (nextColumns === state.columns) {
				return state
			}

			return {
				columns: nextColumns,
			}
		}),
	deleteTask: (taskId) =>
		set((state) => {
			const nextColumns = state.columns.map((column) => ({
				...column,
				tasks: column.tasks.filter((task) => task.id !== taskId),
			}))

			return {
				columns: nextColumns,
				commentDraft: state.openedTaskId === taskId ? '' : state.commentDraft,
				openedTaskId: state.openedTaskId === taskId ? null : state.openedTaskId,
			}
		}),
	resetBoard: () =>
		set({
			...createBoardInitialState(),
		}),
}))
