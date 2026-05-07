import { z } from 'zod'

export const createProjectSchema = z.object({
	name: z
		.string({ message: 'Название должно быть строкой' })
		.min(1, { message: 'Название должно быть не менее 1 символа' })
		.max(100, { message: 'Название должно быть не длиннее 100 символов' }),
	description: z
		.string({ message: 'Описание должно быть строкой' })
		.max(500, { message: 'Описание должно быть не длиннее 500 символов' })
		.optional(),
})

export type CreateProject = z.infer<typeof createProjectSchema>
