import { z } from 'zod'

export const loginRequestSchema = z.object({
	email: z
		.email({ message: 'Email некорректный' })
		.min(1, { message: 'Email не может быть пустым' }),
	password: z
		.string({ message: 'Пароль должен быть строкой' })
		.min(6, { message: 'Пароль должен быть не менее 6 символов' })
		.max(128, { message: 'Пароль должен быть не длиннее 128 символов' }),
})

export type LoginRequest = z.infer<typeof loginRequestSchema>
