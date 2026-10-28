import { z } from 'zod'

export const createBoardSchema = z
	.object({
		name: z
			.string({ message: 'Название должно быть строкой' })
			.trim()
			.min(1, { message: 'Укажите название доски' })
			.max(100, { message: 'Название должно быть не длиннее 100 символов' }),
	})
	.strict()

export const updateBoardSchema = createBoardSchema
export const deleteBoardSchema = z.object({}).strict().default({})

export type CreateBoard = z.infer<typeof createBoardSchema>
export type UpdateBoard = z.infer<typeof updateBoardSchema>
export type DeleteBoard = z.infer<typeof deleteBoardSchema>
