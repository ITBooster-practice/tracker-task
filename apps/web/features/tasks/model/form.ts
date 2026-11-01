import {
	taskLabelKey,
	updateTaskSchema,
	type CreateTask,
	type Task,
	type TaskStatus,
	type UpdateTask,
} from '@repo/types'

export type TaskFormValues = Omit<CreateTask, 'assigneeId' | 'dueDate' | 'labels'> &
	Pick<UpdateTask, 'assigneeId' | 'dueDate'> & { labels: string[] }

export interface TaskFormColumn {
	id: string
	key: string
	title: string
}

export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
	{ value: 'TODO', label: 'К выполнению' },
	{ value: 'IN_PROGRESS', label: 'В работе' },
	{ value: 'IN_REVIEW', label: 'На проверке' },
	{ value: 'DONE', label: 'Готово' },
]

export const TASK_TYPE_OPTIONS = [
	{ value: 'TASK', label: 'Задача' },
	{ value: 'BUG', label: 'Баг' },
	{ value: 'STORY', label: 'История' },
	{ value: 'EPIC', label: 'Эпик' },
	{ value: 'TECH_DEBT', label: 'Технический долг' },
] as const

export const TASK_PRIORITY_OPTIONS = [
	{ value: 'LOW', label: 'Низкий' },
	{ value: 'MEDIUM', label: 'Средний' },
	{ value: 'HIGH', label: 'Высокий' },
	{ value: 'CRITICAL', label: 'Критический' },
] as const

export function taskFormDefaults(status: TaskStatus = 'TODO'): TaskFormValues {
	return {
		title: '',
		description: '',
		labels: [],
		type: 'TASK',
		priority: 'MEDIUM',
		status,
	}
}

export const taskFormSchema = updateTaskSchema.required({ title: true, labels: true })

export function taskEditDefaults(task: Task): TaskFormValues {
	return {
		title: task.title,
		description: task.description ?? '',
		labels: [...task.labels],
		type: task.type,
		priority: task.priority,
		status: task.status,
		boardColumnId: task.boardColumnId,
		assigneeId: task.assigneeId,
		dueDate: task.dueDate,
	}
}

export function taskUpdateData(task: Task, values: TaskFormValues): UpdateTask {
	const data: UpdateTask = {}
	const previousLabels = new Set(task.labels.map(taskLabelKey))
	if (
		values.labels.length !== previousLabels.size ||
		values.labels.some((label) => !previousLabels.has(taskLabelKey(label)))
	)
		data.labels = values.labels
	if (values.title !== task.title) data.title = values.title
	if ((values.description ?? '') !== (task.description ?? ''))
		data.description = values.description ?? ''
	if (values.type !== task.type) data.type = values.type
	if (values.priority !== task.priority) data.priority = values.priority
	if (values.boardColumnId && values.boardColumnId !== task.boardColumnId)
		data.boardColumnId = values.boardColumnId
	if (!values.boardColumnId && values.status !== task.status) data.status = values.status
	if ((values.assigneeId ?? null) !== task.assigneeId)
		data.assigneeId = values.assigneeId ?? null
	if ((values.dueDate?.slice(0, 10) ?? '') !== (task.dueDate?.slice(0, 10) ?? ''))
		data.dueDate = values.dueDate ?? null
	return data
}
