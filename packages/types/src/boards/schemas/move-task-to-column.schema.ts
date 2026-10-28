import { z } from 'zod'
import { columnPositionSchema } from './column.schema'

export const moveTaskToColumnSchema = z
	.object({
		fromColumnId: z.string().trim().min(1),
		toColumnId: z.string().trim().min(1),
		position: columnPositionSchema,
		expectedVersion: z
			.number()
			.int()
			.min(0)
			.max(2_147_483_647)
			.describe(
				'Значение version задачи из последнего ответа API; передайте его без изменений.',
			),
	})
	.strict()

export type MoveTaskToColumn = z.infer<typeof moveTaskToColumnSchema>
