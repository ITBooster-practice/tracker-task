import type { Task } from '@repo/types'

export function isTaskOverdue(task: Pick<Task, 'dueDate'>, now: number) {
	return task.dueDate !== null && Date.parse(task.dueDate) < now
}
