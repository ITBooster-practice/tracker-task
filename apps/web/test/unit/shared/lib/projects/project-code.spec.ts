import { describe, expect, it } from 'vitest'

import { isValidProjectCode, normalizeProjectCodeInput } from '@/shared/lib/projects'

describe('isValidProjectCode', () => {
	it("'AB' (2 буквы) → валидный", () => {
		expect(isValidProjectCode('AB')).toBe(true)
	})

	it("'ABCD' (4 буквы) → валидный", () => {
		expect(isValidProjectCode('ABCD')).toBe(true)
	})

	it("'A' (1 буква) → невалидный", () => {
		expect(isValidProjectCode('A')).toBe(false)
	})

	it("'ABCDE' (5 букв) → невалидный", () => {
		expect(isValidProjectCode('ABCDE')).toBe(false)
	})

	it("'A1' (цифры) → невалидный", () => {
		expect(isValidProjectCode('A1')).toBe(false)
	})

	it("'A-B' (спецсимволы) → невалидный", () => {
		expect(isValidProjectCode('A-B')).toBe(false)
	})

	it('кириллица для валидных форматов корректно обрабатывается', () => {
		expect(isValidProjectCode('пр')).toBe(true)
		expect(isValidProjectCode('ёж')).toBe(true)
	})
})

describe('normalizeProjectCodeInput', () => {
	it('приводит lowercase к uppercase и режет до 4 символов', () => {
		expect(normalizeProjectCodeInput('abcde')).toBe('ABCD')
	})

	it('удаляет цифры и спецсимволы', () => {
		expect(normalizeProjectCodeInput('A1-B!C')).toBe('ABC')
	})

	it('кириллица корректно обрабатывается', () => {
		expect(normalizeProjectCodeInput('проект')).toBe('ПРОЕ')
		expect(normalizeProjectCodeInput('ёж')).toBe('ЁЖ')
	})
})
