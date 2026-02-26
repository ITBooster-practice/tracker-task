import { z } from 'zod'

export const registerRequestSchema = z.object({
	name: z.string().optional(),
	email: z.string().email('Invalid email address'),
	password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type RegisterRequest = z.infer<typeof registerRequestSchema>
