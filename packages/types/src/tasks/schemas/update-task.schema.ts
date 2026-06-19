import { z } from 'zod'
import { createTaskSchema } from './create-task.schema'

export const updateTaskSchema = createTaskSchema.partial()

export type UpdateTask = z.infer<typeof updateTaskSchema>
