import { z } from 'zod'
import { columnPositionSchema } from './column.schema'

export const moveTaskToColumnSchema = z
	.object({
		targetColumnId: z.string().trim().min(1),
		position: columnPositionSchema,
	})
	.strict()

export type MoveTaskToColumn = z.infer<typeof moveTaskToColumnSchema>
