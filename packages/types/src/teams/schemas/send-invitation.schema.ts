import { z } from 'zod'

export const sendInvitationSchema = z.object({
	email: z.email({ message: 'Некорректный email' }),
	role: z.enum(['ADMIN', 'MEMBER'], {
		message: 'Роль должна быть ADMIN или MEMBER. Пригласить как OWNER нельзя',
	}),
})

export type SendInvitation = z.infer<typeof sendInvitationSchema>
