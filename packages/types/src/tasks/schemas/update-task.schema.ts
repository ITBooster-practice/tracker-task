import { z } from 'zod'
import { createTaskSchema } from './create-task.schema'

export const updateTaskSchema = createTaskSchema.partial().extend({
	assigneeId: createTaskSchema.shape.assigneeId.unwrap().nullable().optional(),
	dueDate: createTaskSchema.shape.dueDate.unwrap().nullable().optional(),
})

export type UpdateTask = z.infer<typeof updateTaskSchema>
