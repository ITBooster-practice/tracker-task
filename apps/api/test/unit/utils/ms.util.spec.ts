import { describe, expect, it } from 'vitest'

import { parseTTLToMs } from '../../../src/utils/ms.util'

// ── suite ─────────────────────────────────────────────────────────────────────
describe('parseTTLToMs', () => {
	describe('базовые единицы', () => {
		it('500ms → 500 миллисекунд', () => {
			expect(parseTTLToMs('500ms')).toBe(500)
		})

		it('30s → 30 000 миллисекунд', () => {
			expect(parseTTLToMs('30s')).toBe(30_000)
		})

		it('5min → 300 000 миллисекунд', () => {
			expect(parseTTLToMs('5min')).toBe(300_000)
		})

		it('2h → 7 200 000 миллисекунд', () => {
			expect(parseTTLToMs('2h')).toBe(7_200_000)
		})

		it('7d → 604 800 000 миллисекунд', () => {
			expect(parseTTLToMs('7d')).toBe(604_800_000)
		})

		it('2w → 1 209 600 000 миллисекунд', () => {
			expect(parseTTLToMs('2w')).toBe(1_209_600_000)
		})
	})

	describe('пробел между числом и единицей', () => {
		it('"7 days" → 604 800 000 миллисекунд', () => {
			expect(parseTTLToMs('7 days')).toBe(604_800_000)
		})

		it('"1 hour" → 3 600 000 миллисекунд', () => {
			expect(parseTTLToMs('1 hour')).toBe(3_600_000)
		})

		it('"30 mins" → 1 800 000 миллисекунд', () => {
			expect(parseTTLToMs('30 mins')).toBe(1_800_000)
		})
	})

	describe('регистронезависимость', () => {
		it('"7D" → 604 800 000 миллисекунд', () => {
			expect(parseTTLToMs('7D')).toBe(604_800_000)
		})

		it('"1H" → 3 600 000 миллисекунд', () => {
			expect(parseTTLToMs('1H')).toBe(3_600_000)
		})

		it('"30MIN" → 1 800 000 миллисекунд', () => {
			expect(parseTTLToMs('30MIN')).toBe(1_800_000)
		})

		it('"500MS" → 500 миллисекунд', () => {
			expect(parseTTLToMs('500MS')).toBe(500)
		})
	})

	describe('невалидный ввод — выбрасывает Error', () => {
		it('выбрасывает Error при пустой строке', () => {
			expect(() => parseTTLToMs('')).toThrow(Error)
		})

		it('выбрасывает Error при неизвестной единице ("7x")', () => {
			expect(() => parseTTLToMs('7x')).toThrow(Error)
		})

		it('выбрасывает Error при некорректном формате ("abc")', () => {
			expect(() => parseTTLToMs('abc')).toThrow(Error)
		})

		it('выбрасывает Error при вводе только числа ("123")', () => {
			expect(() => parseTTLToMs('123')).toThrow(Error)
		})
	})
})
