import { z } from 'zod'
import {
	TaskStatusSchema,
	PrioritySchema,
	TaskTypeSchema,
} from '../schemas/create-task.schema'
import type { TaskFilterQuery } from '../schemas/task-filter-query.schema'

export type TaskStatus = z.infer<typeof TaskStatusSchema>
export type Priority = z.infer<typeof PrioritySchema>
export type TaskType = z.infer<typeof TaskTypeSchema>

export interface Task {
	id: string
	title: string
	description: string | null
	status: TaskStatus
	priority: Priority
	type: TaskType
	position: number
	version: number
	dueDate: string | null
	projectId: string
	assigneeId: string | null
	createdAt: string
	updatedAt: string
}

export type TaskFilterParams = Partial<TaskFilterQuery>
