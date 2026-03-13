import { z } from 'zod'

export const changeRoleSchema = z.object({
	role: z.enum(['ADMIN', 'MEMBER'], {
		message:
			'Роль должна быть ADMIN или MEMBER. Назначить OWNER через этот эндпоинт нельзя',
	}),
})

export type ChangeRole = z.infer<typeof changeRoleSchema>
