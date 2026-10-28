import { TaskStatusSchema, type BoardView, type MoveTaskToColumn } from '@repo/types'

export function optimisticBoardMove(
	view: BoardView,
	taskId: string,
	{ fromColumnId, toColumnId, position, expectedVersion }: MoveTaskToColumn,
): BoardView {
	const source = view.columns.find((column) => column.id === fromColumnId)
	const target = view.columns.find((column) => column.id === toColumnId)
	const task = source?.tasks.find((item) => item.id === taskId)
	if (!source || !target || !task || task.version !== expectedVersion) return view

	const status = target.isSystem ? TaskStatusSchema.safeParse(target.key) : null
	const movedTask = {
		...task,
		boardColumnId: toColumnId,
		status: status?.success ? status.data : task.status,
	}

	return {
		...view,
		columns: view.columns.map((column) => {
			if (column.id !== fromColumnId && column.id !== toColumnId) return column
			const tasks = column.tasks.filter((item) => item.id !== taskId)
			if (column.id === toColumnId) tasks.splice(position, 0, movedTask)
			return {
				...column,
				tasks: tasks.map((item, index) => ({ ...item, position: index })),
			}
		}),
	}
}
