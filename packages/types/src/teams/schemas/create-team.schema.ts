import { z } from 'zod'

export const createTeamSchema = z.object({
	name: z
		.string({ message: 'Название должно быть строкой' })
		.min(2, { message: 'Название должно быть не менее 2 символов' })
		.max(50, { message: 'Название должно быть не длиннее 50 символов' }),
	description: z
		.string({ message: 'Описание должно быть строкой' })
		.max(100, { message: 'Описание должно быть не длиннее 100 символов' })
		.optional(),
	avatarUrl: z.url({ message: 'Некорректный URL аватара' }).optional(),
})

export type CreateTeam = z.infer<typeof createTeamSchema>
