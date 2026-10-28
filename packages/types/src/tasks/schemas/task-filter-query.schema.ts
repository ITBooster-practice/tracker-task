import { z } from 'zod'
import { paginationQuerySchema } from '../../pagination/schemas/pagination-query.schema'
import { PrioritySchema, TaskStatusSchema, TaskTypeSchema } from './create-task.schema'

export const TaskSortBySchema = z.enum(['createdAt', 'priority', 'status'])
export const TaskSortOrderSchema = z.enum(['asc', 'desc'])
export const DEFAULT_TASK_SORT_BY = 'createdAt'
export const DEFAULT_TASK_SORT_ORDER = 'desc'

export type TaskSortBy = z.infer<typeof TaskSortBySchema>
export type TaskSortOrder = z.infer<typeof TaskSortOrderSchema>

export const taskFilterQuerySchema = paginationQuerySchema.extend({
	status: TaskStatusSchema.optional(),
	priority: PrioritySchema.optional(),
	assigneeId: z.string().optional(),
	type: TaskTypeSchema.optional(),
	search: z.string().trim().max(255).optional(),
	sortBy: TaskSortBySchema.default(DEFAULT_TASK_SORT_BY),
	sortOrder: TaskSortOrderSchema.default(DEFAULT_TASK_SORT_ORDER),
})

export type TaskFilterQuery = z.infer<typeof taskFilterQuerySchema>
