import { describe, expect, it } from 'vitest'

import { isValidProjectCode, normalizeProjectCodeInput } from '@/shared/lib/projects'

describe('isValidProjectCode', () => {
	it('пустое значение', () => {
		const result = isValidProjectCode('')

		expect(result).toBe(false)
	})

	it('значение меньше MIN_LENGTH', () => {
		const result = isValidProjectCode('a')

		expect(result).toBe(false)
	})

	it('значение больше MAX_LENGTH', () => {
		const result = isValidProjectCode('aaaaa')

		expect(result).toBe(false)
	})

	it('содержит невалидные символы (цифры)', () => {
		const result = isValidProjectCode('AB1C')

		expect(result).toBe(false)
	})

	it('lowercase приводится к uppercase → валидно', () => {
		const result = isValidProjectCode('аааа')

		expect(result).toBe(true)
	})

	it('содержит эмодзи', () => {
		const result = isValidProjectCode('а👋')

		expect(result).toBe(false)
	})

	it('валидный код латиницей', () => {
		const result = isValidProjectCode('AB')

		expect(result).toBe(true)
	})

	it('валидный код кириллицей', () => {
		const result = isValidProjectCode('ПР')

		expect(result).toBe(true)
	})

	it('буква Ё допустима', () => {
		const result = isValidProjectCode('ЁЖ')

		expect(result).toBe(true)
	})

	it('пробелы тримятся', () => {
		const result = isValidProjectCode(' AB ')

		expect(result).toBe(true)
	})

	it('ровно MIN_LENGTH', () => {
		const result = isValidProjectCode('AB')

		expect(result).toBe(true)
	})

	it('ровно MAX_LENGTH', () => {
		const result = isValidProjectCode('ABCD')

		expect(result).toBe(true)
	})
})

describe('normalizeProjectCodeInput', () => {
	it('пустое значение', () => {
		const result = normalizeProjectCodeInput('')

		expect(result).toBe('')
	})

	it('lowercase приводится к uppercase', () => {
		const result = normalizeProjectCodeInput('abc')

		expect(result).toBe('ABC')
	})

	it('обрезает до MAX_LENGTH', () => {
		const result = normalizeProjectCodeInput('ABCDEF')

		expect(result).toBe('ABCD')
	})

	it('ровно MAX_LENGTH', () => {
		const result = normalizeProjectCodeInput('ABCD')

		expect(result).toBe('ABCD')
	})

	it('цифры отфильтровываются', () => {
		const result = normalizeProjectCodeInput('A1B2C')

		expect(result).toBe('ABC')
	})

	it('эмодзи отфильтровываются', () => {
		const result = normalizeProjectCodeInput('A👋B')

		expect(result).toBe('AB')
	})

	it('смесь невалидных символов', () => {
		const result = normalizeProjectCodeInput('a!1b@2c')

		expect(result).toBe('ABC')
	})

	it('кириллица нормализуется', () => {
		const result = normalizeProjectCodeInput('проект')

		expect(result).toBe('ПРОЕ')
	})

	it('буква ё нормализуется', () => {
		const result = normalizeProjectCodeInput('ёж')

		expect(result).toBe('ЁЖ')
	})

	it('все невалидные символы', () => {
		const result = normalizeProjectCodeInput('123!@#')

		expect(result).toBe('')
	})
})
