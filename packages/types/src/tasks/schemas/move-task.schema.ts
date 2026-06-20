import { z } from 'zod'
import { TaskStatusSchema } from './create-task.schema'

export const moveTaskSchema = z.object({
	status: TaskStatusSchema,
	position: z.number().int().min(0),
})

export type MoveTask = z.infer<typeof moveTaskSchema>
