import { TaskStatusSchema, type TaskStatus } from '@repo/types'

import type { BoardColumn, BoardTaskMoveInput } from './types'

const clampIndex = (value: number, min: number, max: number) =>
	Math.min(Math.max(value, min), max)

export const getBoardColumnTaskStatus = (
	column: BoardColumn,
	previousStatus: TaskStatus,
) => {
	const parsed = TaskStatusSchema.safeParse(column.key)
	return parsed.success ? parsed.data : previousStatus
}

const findTaskLocation = (columns: BoardColumn[], taskId: string) => {
	for (const [columnIndex, column] of columns.entries()) {
		const taskIndex = column.tasks.findIndex((task) => task.id === taskId)

		if (taskIndex >= 0) {
			return {
				boardColumnId: column.id,
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
	{ taskId, toColumnId, toIndex, priority, assigneeId }: BoardTaskMoveInput,
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

	const adjustedIndex = clampIndex(
		toIndex,
		0,
		targetColumn.tasks.length -
			(sourceLocation.columnIndex === targetColumnIndex ? 1 : 0),
	)

	if (
		sourceLocation.columnIndex === targetColumnIndex &&
		adjustedIndex === sourceLocation.taskIndex &&
		(priority === undefined ||
			columns[sourceLocation.columnIndex]!.tasks[sourceLocation.taskIndex]!.priority ===
				priority) &&
		(assigneeId === undefined ||
			columns[sourceLocation.columnIndex]!.tasks[sourceLocation.taskIndex]!.assigneeId ===
				assigneeId)
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
		...(priority !== undefined && { priority }),
		...(assigneeId !== undefined && { assigneeId }),
		boardColumnId: toColumnId,
		status: getBoardColumnTaskStatus(nextTargetColumn, task.status),
	})

	return nextColumns
}
