import {
	formatTaskCode,
	type BoardTask as ApiBoardTask,
	type BoardView,
} from '@repo/types'

import type { BoardAssignee, BoardColumn, BoardTask } from './types'

export const toBoardCardViewModel = (
	task: ApiBoardTask,
	assignees: readonly BoardAssignee[] = [],
): BoardTask => ({
	...task,
	key: formatTaskCode(task.id),
	assignee:
		task.assigneeId === null
			? null
			: (assignees.find((assignee) => assignee.id === task.assigneeId) ?? {
					id: task.assigneeId,
					name: 'Неизвестный пользователь',
					initials: '?',
				}),
})

export const toBoardColumnsViewModel = (
	view: BoardView,
	assignees: readonly BoardAssignee[] = [],
): BoardColumn[] =>
	view.columns.map((column) => ({
		...column,
		tasks: column.tasks.map((task) => toBoardCardViewModel(task, assignees)),
	}))
