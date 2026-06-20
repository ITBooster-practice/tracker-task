import { z } from 'zod'
import { paginationQuerySchema } from '../../pagination/schemas/pagination-query.schema'
import { PrioritySchema, TaskStatusSchema } from './create-task.schema'

export const taskFilterQuerySchema = paginationQuerySchema.extend({
	status: TaskStatusSchema.optional(),
	priority: PrioritySchema.optional(),
	assigneeId: z.string().optional(),
})

export type TaskFilterQuery = z.infer<typeof taskFilterQuerySchema>
