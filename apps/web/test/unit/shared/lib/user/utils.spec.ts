import { describe, expect, it } from 'vitest'

import { getNameInitials, getUserDisplayName } from '@/shared/lib/user/utils'

describe('getUserDisplayName', () => {
	it('возвращает name, если он задан и не пустой после trim', () => {
		expect(getUserDisplayName({ name: '  Alice  ', email: 'alice@test.dev' })).toBe(
			'Alice',
		)
	})

	it('возвращает email, если name отсутствует', () => {
		expect(getUserDisplayName({ email: 'alice@test.dev' })).toBe('alice@test.dev')
	})

	it('возвращает email, если name состоит только из пробелов', () => {
		expect(getUserDisplayName({ name: '   ', email: 'alice@test.dev' })).toBe(
			'alice@test.dev',
		)
	})

	it('возвращает дефолт, если ни name, ни email не заданы', () => {
		expect(getUserDisplayName(undefined)).toBe('Пользователь')
		expect(getUserDisplayName(null)).toBe('Пользователь')
	})
})

describe('getNameInitials', () => {
	it('берет первые буквы максимум двух слов и приводит к upper-case', () => {
		expect(getNameInitials('alice cooper')).toBe('AC')
	})

	it('игнорирует лишние пробелы между словами', () => {
		expect(getNameInitials('  john   doe  ')).toBe('JD')
	})

	it('для одного слова возвращает одну букву', () => {
		expect(getNameInitials('alice')).toBe('A')
	})

	it('для пустого/undefined/null возвращает пустую строку', () => {
		expect(getNameInitials('')).toBe('')
		expect(getNameInitials(undefined)).toBe('')
		expect(getNameInitials(null)).toBe('')
	})
})
