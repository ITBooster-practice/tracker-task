import { z } from 'zod'

const columnIdSchema = z.string().trim().min(1, { message: 'Укажите ID колонки' })
export const columnPositionSchema = z.number().int().min(0).max(2_147_483_647)

export const createColumnSchema = z
	.object({
		key: z.string().trim().min(1).max(64),
		title: z.string().trim().min(1).max(100),
		position: columnPositionSchema.optional(),
	})
	.strict()

export const updateColumnSchema = createColumnSchema
	.pick({ key: true, title: true })
	.partial()
	.refine((value) => Object.values(value).some((field) => field !== undefined), {
		message: 'Укажите ключ или название колонки',
	})

export const deleteColumnSchema = z.object({ targetColumnId: columnIdSchema }).strict()

export const reorderColumnsSchema = z
	.object({
		columnIds: z
			.array(columnIdSchema)
			.min(1)
			.refine((ids) => new Set(ids).size === ids.length, {
				message: 'ID колонок не должны повторяться',
			}),
	})
	.strict()

export type CreateColumn = z.infer<typeof createColumnSchema>
export type UpdateColumn = z.infer<typeof updateColumnSchema>
export type DeleteColumn = z.infer<typeof deleteColumnSchema>
export type ReorderColumns = z.infer<typeof reorderColumnsSchema>
