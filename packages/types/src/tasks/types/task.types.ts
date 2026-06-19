import { z } from 'zod'
import { TaskStatusSchema, PrioritySchema } from '../schemas/create-task.schema'

export type TaskStatus = z.infer<typeof TaskStatusSchema>
export type Priority = z.infer<typeof PrioritySchema>

export interface Task {
	id: string
	title: string
	description: string | null
	status: TaskStatus
	priority: Priority
	position: number
	dueDate: string | null
	projectId: string
	assigneeId: string | null
	createdAt: string
	updatedAt: string
}
