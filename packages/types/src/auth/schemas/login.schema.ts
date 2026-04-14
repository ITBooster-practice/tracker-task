import { z } from 'zod'

import { userEmailSchema } from './user-fields.schema'

export const loginRequestSchema = z.object({
	email: userEmailSchema,
	password: z
		.string({ message: 'Пароль должен быть строкой' })
		.min(6, { message: 'Пароль должен быть не менее 6 символов' })
		.max(128, { message: 'Пароль должен быть не длиннее 128 символов' }),
})

export type LoginRequest = z.infer<typeof loginRequestSchema>
