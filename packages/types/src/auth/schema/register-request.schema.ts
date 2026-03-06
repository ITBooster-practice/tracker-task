import { z } from 'zod'

export const registerRequestSchema = z.object({
	name: z
		.string({ message: 'Имя должно быть строкой' })
		.max(50, { message: 'Имя должно быть не длиннее 50 символов' })
		.optional(),
	email: z
		.email({ error: 'Email некорректный' })
		.min(1, { message: 'Email не может быть пустым' }),
	password: z
		.string({ message: 'Пароль должен быть строкой' })
		.min(6, { message: 'Пароль должен быть не менее 6 символов' })
		.max(128, { message: 'Пароль должен быть не длиннее 128 символов' }),
})

export type RegisterRequest = z.infer<typeof registerRequestSchema>

export const registerRequestWithConfirmPasswordSchema = registerRequestSchema
	.extend({
		confirmPassword: registerRequestSchema.shape.password,
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Пароли не совпадают.',
		path: ['confirmPassword'],
	})

export type RegisterRequestWithConfirmPassword = z.infer<
	typeof registerRequestWithConfirmPasswordSchema
>
