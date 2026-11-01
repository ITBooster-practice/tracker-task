import { z } from 'zod'

export const boardColumnColorSchema = z.enum([
	'gray',
	'blue',
	'cyan',
	'green',
	'yellow',
	'orange',
	'red',
	'violet',
])
export type BoardColumnColor = z.infer<typeof boardColumnColorSchema>

const boardColumnDraftSchema = z
	.object({
		id: z.string().min(1).optional(),
		key: z.string().trim().min(1).max(64),
		title: z.string().trim().min(1, 'Укажите название колонки').max(100),
		color: boardColumnColorSchema,
	})
	.strict()

const boardColumnsSchema = z
	.array(boardColumnDraftSchema)
	.min(1, 'Оставьте хотя бы одну колонку')
	.max(50)
	.superRefine((columns, ctx) => {
		for (const field of ['key', 'title', 'id'] as const) {
			const values = columns
				.map((column) => column[field])
				.filter((value) => value !== undefined)
			if (new Set(values).size !== values.length)
				ctx.addIssue({
					code: 'custom',
					message: `Колонки не должны иметь повторяющиеся ${field === 'title' ? 'названия' : 'ключи или ID'}`,
				})
		}
	})

export const createBoardSchema = z
	.object({
		name: z
			.string({ message: 'Название должно быть строкой' })
			.trim()
			.min(1, { message: 'Укажите название доски' })
			.max(100, { message: 'Название должно быть не длиннее 100 символов' }),
		description: z.string().trim().max(2000).nullish(),
		columns: boardColumnsSchema.optional(),
	})
	.strict()

export const updateBoardSchema = createBoardSchema
	.extend({
		expectedUpdatedAt: z.iso.datetime().optional(),
		columnSnapshot: z
			.array(z.object({ id: z.string().min(1), updatedAt: z.iso.datetime() }).strict())
			.optional(),
		removedColumns: z
			.array(
				z
					.object({
						id: z.string().min(1),
						targetKey: z.string().min(1),
						requireEmpty: z.boolean().optional(),
					})
					.strict(),
			)
			.optional(),
	})
	.superRefine((value, ctx) => {
		if (value.columns && (!value.expectedUpdatedAt || !value.columnSnapshot))
			ctx.addIssue({
				code: 'custom',
				message: 'Для сохранения колонок нужен снимок доски',
			})
		if (!value.columns && value.removedColumns?.length)
			ctx.addIssue({ code: 'custom', message: 'Укажите итоговый список колонок' })
	})
export const deleteBoardSchema = z.object({}).strict().default({})

export type CreateBoard = z.infer<typeof createBoardSchema>
export type UpdateBoard = z.infer<typeof updateBoardSchema>
export type DeleteBoard = z.infer<typeof deleteBoardSchema>
