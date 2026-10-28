import type { BoardTask as ApiBoardTask, BoardView } from '@repo/types'

import type { BoardAssignee, BoardColumn, BoardTask } from './types'

const createdAtFormatter = new Intl.DateTimeFormat('ru-RU', {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
	timeZone: 'UTC',
})

export const toBoardCardViewModel = (
	task: ApiBoardTask,
	assignees: readonly BoardAssignee[] = [],
): BoardTask => ({
	...task,
	key: task.id,
	assignee:
		task.assigneeId === null
			? null
			: (assignees.find((assignee) => assignee.id === task.assigneeId) ?? {
					id: task.assigneeId,
					name: 'Неизвестный пользователь',
					initials: '?',
				}),
	tags: [],
	comments: [],
	history: [],
	createdAtLabel: createdAtFormatter.format(new Date(task.createdAt)),
})

export const toBoardColumnsViewModel = (
	view: BoardView,
	assignees: readonly BoardAssignee[] = [],
): BoardColumn[] =>
	view.columns.map((column) => ({
		...column,
		tasks: column.tasks.map((task) => toBoardCardViewModel(task, assignees)),
	}))
