import { z } from 'zod'

import { createEmailSchema } from '../../auth/schemas/user-fields.schema'

export const sendInvitationSchema = z.object({
	email: createEmailSchema({ invalid: 'Некорректный email' }),
	role: z.enum(['ADMIN', 'MEMBER'], {
		message: 'Роль должна быть ADMIN или MEMBER. Пригласить как OWNER нельзя',
	}),
})

export type SendInvitation = z.infer<typeof sendInvitationSchema>
