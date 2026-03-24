import { describe, expect, it } from 'vitest'

import { registerRequestWithConfirmPasswordSchema } from '@repo/types'

const validRegister = {
	email: 'user@test.com',
	password: '123456',
	confirmPassword: '123456',
	name: 'Иван',
}

describe('registerRequestWithConfirmPasswordSchema', () => {
	it('валидные данные', () => {
		const result = registerRequestWithConfirmPasswordSchema.safeParse(validRegister)

		expect(result.success).toBe(true)
	})

	it('name опционален', () => {
		const { name: _, ...withoutName } = validRegister
		const result = registerRequestWithConfirmPasswordSchema.safeParse(withoutName)

		expect(result.success).toBe(true)
	})

	it('name длиннее 50 символов', () => {
		const result = registerRequestWithConfirmPasswordSchema.safeParse({
			...validRegister,
			name: 'a'.repeat(51),
		})

		expect(result.success).toBe(false)

		if (!result.success) {
			expect(result.error.issues[0]!.message).toBe(
				'Имя должно быть не длиннее 50 символов',
			)
		}
	})

	it('пароли не совпадают', () => {
		const result = registerRequestWithConfirmPasswordSchema.safeParse({
			...validRegister,
			confirmPassword: 'другой-пароль',
		})

		expect(result.success).toBe(false)

		if (!result.success) {
			const confirmError = result.error.issues.find((i) =>
				i.path.includes('confirmPassword'),
			)

			expect(confirmError?.message).toBe('Пароли не совпадают.')
		}
	})

	it('пароли совпадают', () => {
		const result = registerRequestWithConfirmPasswordSchema.safeParse({
			...validRegister,
			password: 'abcdef',
			confirmPassword: 'abcdef',
		})

		expect(result.success).toBe(true)
	})
})
