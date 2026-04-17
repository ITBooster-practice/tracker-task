import { BOARD_ASSIGNEE_ALL_OPTION_LABEL, BOARD_FILTER_ALL } from './constants'
import type {
	BoardAssigneeFilter,
	BoardColumn,
	BoardFilters,
	BoardStat,
	BoardTask,
	BoardTaskMoveInput,
} from './types'

const clampIndex = (value: number, min: number, max: number) =>
	Math.min(Math.max(value, min), max)

const normalizeSearchValue = (value: string) => value.trim().toLowerCase()

const findTaskLocation = (columns: BoardColumn[], taskId: string) => {
	for (const [columnIndex, column] of columns.entries()) {
		const taskIndex = column.tasks.findIndex((task) => task.id === taskId)

		if (taskIndex >= 0) {
			return {
				columnId: column.id,
				columnIndex,
				taskIndex,
			}
		}
	}

	return null
}

export const flattenBoardTasks = (columns: BoardColumn[]) =>
	columns.flatMap((column) => column.tasks)

export const findBoardTask = (columns: BoardColumn[], taskId: string | null) => {
	if (!taskId) {
		return null
	}

	return flattenBoardTasks(columns).find((task) => task.id === taskId) ?? null
}

export const moveTaskInColumns = (
	columns: BoardColumn[],
	{ taskId, toColumnId, toIndex }: BoardTaskMoveInput,
) => {
	const sourceLocation = findTaskLocation(columns, taskId)

	if (!sourceLocation) {
		return columns
	}

	const targetColumnIndex = columns.findIndex((column) => column.id === toColumnId)

	if (targetColumnIndex < 0) {
		return columns
	}

	const targetColumn = columns[targetColumnIndex]

	if (!targetColumn) {
		return columns
	}

	const boundedIndex = clampIndex(toIndex, 0, targetColumn.tasks.length)
	const adjustedIndex =
		sourceLocation.columnIndex === targetColumnIndex &&
		sourceLocation.taskIndex < boundedIndex
			? boundedIndex - 1
			: boundedIndex

	if (
		sourceLocation.columnIndex === targetColumnIndex &&
		adjustedIndex === sourceLocation.taskIndex
	) {
		return columns
	}

	const nextColumns = columns.map((column) => ({
		...column,
		tasks: [...column.tasks],
	}))

	const sourceColumn = nextColumns[sourceLocation.columnIndex]
	const nextTargetColumn = nextColumns[targetColumnIndex]

	if (!sourceColumn || !nextTargetColumn) {
		return columns
	}

	const [task] = sourceColumn.tasks.splice(sourceLocation.taskIndex, 1)

	if (!task) {
		return columns
	}

	nextTargetColumn.tasks.splice(adjustedIndex, 0, {
		...task,
		columnId: toColumnId,
	})

	return nextColumns
}

export const updateBoardTask = (
	columns: BoardColumn[],
	taskId: string,
	updater: (task: BoardTask) => BoardTask,
) => {
	let hasChanges = false

	const nextColumns = columns.map((column) => {
		const taskIndex = column.tasks.findIndex((task) => task.id === taskId)

		if (taskIndex < 0) {
			return column
		}

		hasChanges = true

		return {
			...column,
			tasks: column.tasks.map((task) => (task.id === taskId ? updater(task) : task)),
		}
	})

	return hasChanges ? nextColumns : columns
}

export const filterBoardColumns = (columns: BoardColumn[], filters: BoardFilters) =>
	columns.map((column) => ({
		...column,
		tasks: column.tasks.filter((task) => {
			const normalizedQuery = normalizeSearchValue(filters.query)
			const matchesQuery =
				normalizedQuery.length === 0 ||
				[task.key, task.title, task.assignee.name, ...task.tags].some((value) =>
					value.toLowerCase().includes(normalizedQuery),
				)

			const matchesType = filters.type === BOARD_FILTER_ALL || task.type === filters.type
			const matchesAssignee =
				filters.assignee === BOARD_FILTER_ALL || task.assignee.id === filters.assignee

			return matchesQuery && matchesType && matchesAssignee
		}),
	}))

export const buildBoardAssigneeOptions = (tasks: BoardTask[]) => {
	const seenAssignees = new Set<string>()
	const options: Array<{ label: string; value: BoardAssigneeFilter }> = [
		{ label: BOARD_ASSIGNEE_ALL_OPTION_LABEL, value: BOARD_FILTER_ALL },
	]

	for (const task of tasks) {
		if (seenAssignees.has(task.assignee.id)) {
			continue
		}

		seenAssignees.add(task.assignee.id)
		options.push({
			label: task.assignee.name,
			value: task.assignee.id,
		})
	}

	return options
}

export const buildBoardAssignees = (tasks: BoardTask[]) => {
	const seenAssignees = new Set<string>()

	return tasks.reduce<BoardTask['assignee'][]>((assignees, task) => {
		if (seenAssignees.has(task.assignee.id)) {
			return assignees
		}

		seenAssignees.add(task.assignee.id)
		return [...assignees, task.assignee]
	}, [])
}

export const hasBoardActiveFilters = (filters: BoardFilters) =>
	normalizeSearchValue(filters.query).length > 0 ||
	filters.type !== BOARD_FILTER_ALL ||
	filters.assignee !== BOARD_FILTER_ALL

export const buildBoardStats = (columns: BoardColumn[]): BoardStat[] => {
	const totalTasksCount = flattenBoardTasks(columns).length
	const doneTasksCount = columns.find((column) => column.id === 'DONE')?.tasks.length ?? 0
	const reviewTasksCount =
		columns.find((column) => column.id === 'IN_REVIEW')?.tasks.length ?? 0
	const inProgressTasksCount =
		columns.find((column) => column.id === 'IN_PROGRESS')?.tasks.length ?? 0
	const completionRate =
		totalTasksCount === 0 ? 0 : Math.round((doneTasksCount / totalTasksCount) * 100)

	return [
		{
			label: 'Прогресс',
			value: `${completionRate}%`,
			helper: `${doneTasksCount} из ${totalTasksCount} задач завершены`,
		},
		{
			label: 'В работе',
			value: `${inProgressTasksCount}`,
			helper: 'Карточки, над которыми команда работает сейчас',
		},
		{
			label: 'На ревью',
			value: `${reviewTasksCount}`,
			helper: 'Финальная проверка перед закрытием',
		},
	]
}
