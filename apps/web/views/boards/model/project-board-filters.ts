import { PrioritySchema, TaskTypeSchema, type Priority } from '@repo/types'

import { isTaskOverdue } from '@/features/tasks/model/is-task-overdue'
import { getServerNow } from '@/shared/lib/server-clock'

import { BOARD_FILTER_ALL } from './constants'
import type { BoardAssignee, BoardColumn, BoardTask, BoardTypeFilter } from './types'

export const BOARD_UNASSIGNED = 'UNASSIGNED'
export type BoardPriorityFilter = Priority | typeof BOARD_FILTER_ALL

export interface ProjectBoardFilters {
	query: string
	type: BoardTypeFilter
	priority: BoardPriorityFilter
	assignee: string
	overdue?: boolean
}

export const emptyProjectBoardFilters: ProjectBoardFilters = {
	query: '',
	type: BOARD_FILTER_ALL,
	priority: BOARD_FILTER_ALL,
	assignee: BOARD_FILTER_ALL,
}

export function parseProjectBoardFilters(params: URLSearchParams): ProjectBoardFilters {
	const type = TaskTypeSchema.safeParse(params.get('type'))
	const priority = PrioritySchema.safeParse(params.get('priority'))
	return {
		query: params.get('q') ?? '',
		type: type.success ? type.data : BOARD_FILTER_ALL,
		priority: priority.success ? priority.data : BOARD_FILTER_ALL,
		assignee: params.get('assignee')?.trim() || BOARD_FILTER_ALL,
		...(params.get('overdue') === 'true' && { overdue: true }),
	}
}

export function projectBoardFilterParams(
	current: URLSearchParams,
	filters: ProjectBoardFilters,
) {
	const params = new URLSearchParams(current)
	const entries: [string, string][] = [
		['q', filters.query],
		['type', filters.type],
		['priority', filters.priority],
		['assignee', filters.assignee],
	]
	for (const [name, value] of entries) {
		if (!value || (name !== 'q' && value === BOARD_FILTER_ALL)) params.delete(name)
		else params.set(name, value)
	}
	if (filters.overdue) params.set('overdue', 'true')
	else params.delete('overdue')
	return params
}

export const hasProjectBoardFilters = (filters: ProjectBoardFilters) =>
	filters.query.trim().length > 0 ||
	filters.type !== BOARD_FILTER_ALL ||
	filters.priority !== BOARD_FILTER_ALL ||
	filters.assignee !== BOARD_FILTER_ALL ||
	Boolean(filters.overdue)

export function matchesProjectBoardFilters(
	task: Pick<
		BoardTask,
		'title' | 'key' | 'labels' | 'dueDate' | 'type' | 'priority' | 'assigneeId'
	> & { id?: string },
	filters: ProjectBoardFilters,
	now = getServerNow(),
) {
	const query = filters.query.trim().toLocaleLowerCase('ru-RU')
	return (
		(!filters.overdue || isTaskOverdue(task, now)) &&
		(!query ||
			task.title.toLocaleLowerCase('ru-RU').includes(query) ||
			task.key.toLocaleLowerCase('ru-RU').includes(query) ||
			task.id?.toLocaleLowerCase('ru-RU').includes(query) ||
			task.labels.some((label) =>
				label
					.normalize('NFC')
					.toLocaleLowerCase('ru-RU')
					.includes(query.normalize('NFC')),
			)) &&
		(filters.type === BOARD_FILTER_ALL || task.type === filters.type) &&
		(filters.priority === BOARD_FILTER_ALL || task.priority === filters.priority) &&
		(filters.assignee === BOARD_FILTER_ALL ||
			(filters.assignee === BOARD_UNASSIGNED
				? task.assigneeId === null
				: task.assigneeId === filters.assignee))
	)
}

export function filterProjectBoardColumns(
	columns: BoardColumn[],
	filters: ProjectBoardFilters,
	now = getServerNow(),
) {
	return columns.map((column) => ({
		...column,
		tasks: column.tasks.filter((task) => matchesProjectBoardFilters(task, filters, now)),
	}))
}

export function projectBoardAssigneeOptions(
	columns: BoardColumn[],
	assignees: readonly Pick<BoardAssignee, 'id' | 'name'>[],
	selected: string,
) {
	const options = new Map<string, string>(assignees.map((item) => [item.id, item.name]))
	for (const column of columns)
		for (const task of column.tasks) {
			if (task.assigneeId && !options.has(task.assigneeId))
				options.set(
					task.assigneeId,
					`Неизвестный участник (${task.assigneeId.slice(0, 8)})`,
				)
		}
	if (
		selected !== BOARD_FILTER_ALL &&
		selected !== BOARD_UNASSIGNED &&
		!options.has(selected)
	)
		options.set(selected, 'Участник недоступен')
	return [
		{ value: BOARD_FILTER_ALL, label: 'Все исполнители' },
		{ value: BOARD_UNASSIGNED, label: 'Без исполнителя' },
		...Array.from(options, ([value, label]) => ({ value, label })).sort((a, b) =>
			a.label.localeCompare(b.label, 'ru'),
		),
	]
}

// Visible indices refer to the filtered list; the API expects the full target order.
export function fullBoardMovePosition(
	columns: BoardColumn[],
	visibleColumns: BoardColumn[],
	taskId: string,
	toColumnId: string,
	toIndex: number,
) {
	const target = columns.find((column) => column.id === toColumnId)
	const visibleTarget = visibleColumns.find((column) => column.id === toColumnId)
	if (!target || !visibleTarget) return null
	const full = target.tasks.filter((task) => task.id !== taskId)
	const visible = visibleTarget.tasks.filter((task) => task.id !== taskId)
	const index = Math.min(Math.max(toIndex, 0), visible.length)
	const originalIndex = target.tasks.findIndex((task) => task.id === taskId)
	if (
		originalIndex >= 0 &&
		visibleTarget.tasks.findIndex((task) => task.id === taskId) === index
	)
		return originalIndex
	const anchor = visible[index]
	return anchor ? full.findIndex((task) => task.id === anchor.id) : full.length
}
