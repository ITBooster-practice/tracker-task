import { describe, expect, it } from 'vitest'

import { loginRequestSchema } from '@repo/types'

const validLogin = { email: 'user@test.com', password: '123456' }

describe('loginRequestSchema', () => {
	it('валидные данные', () => {
		const result = loginRequestSchema.safeParse(validLogin)

		expect(result.success).toBe(true)
	})

	describe('email', () => {
		it.each([
			['пустой', '', 'Email некорректный'],
			['без @', 'not-an-email', 'Email некорректный'],
			['без домена', 'user@', 'Email некорректный'],
		])('%s', (_label, email, expectedMessage) => {
			const result = loginRequestSchema.safeParse({ ...validLogin, email })

			expect(result.success).toBe(false)

			if (!result.success) {
				expect(result.error.issues[0]!.message).toBe(expectedMessage)
			}
		})
	})

	describe('password', () => {
		it('короче 6 символов → ошибка', () => {
			const result = loginRequestSchema.safeParse({
				...validLogin,
				password: '12345',
			})

			expect(result.success).toBe(false)

			if (!result.success) {
				expect(result.error.issues[0]!.message).toBe(
					'Пароль должен быть не менее 6 символов',
				)
			}
		})

		it('ровно 6 символов → успех', () => {
			const result = loginRequestSchema.safeParse({
				...validLogin,
				password: '123456',
			})

			expect(result.success).toBe(true)
		})

		it('длиннее 128 символов → ошибка', () => {
			const result = loginRequestSchema.safeParse({
				...validLogin,
				password: 'a'.repeat(129),
			})

			expect(result.success).toBe(false)

			if (!result.success) {
				expect(result.error.issues[0]!.message).toBe(
					'Пароль должен быть не длиннее 128 символов',
				)
			}
		})
	})
})
