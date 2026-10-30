import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { themeBootstrapScript } from '@/features/theme/bootstrap'

describe('theme bootstrap before hydration', () => {
	beforeEach(() => {
		localStorage.clear()
		document.documentElement.className = 'dark other-class'
		document.documentElement.style.colorScheme = 'dark'
	})

	afterEach(() => vi.restoreAllMocks())

	it.each(['light', 'dark'])('applies the saved %s theme synchronously', (theme) => {
		localStorage.setItem('theme', JSON.stringify({ state: { theme }, version: 0 }))

		window.eval(themeBootstrapScript)

		expect(document.documentElement.classList.contains('dark')).toBe(theme === 'dark')
		expect(document.documentElement.style.colorScheme).toBe(theme)
		expect(document.documentElement.classList.contains('other-class')).toBe(true)
		expect(JSON.parse(localStorage.getItem('theme')!).state.theme).toBe(theme)
	})

	it.each([
		null,
		'not json',
		'null',
		'{}',
		'{"state":null}',
		'{"state":{"theme":"system"},"version":0}',
		'{"state":{"theme":"light"},"version":1}',
	])('falls back to dark for missing or invalid storage: %s', (value) => {
		if (value !== null) localStorage.setItem('theme', value)
		document.documentElement.className = ''
		document.documentElement.style.colorScheme = 'light'

		expect(() => window.eval(themeBootstrapScript)).not.toThrow()
		expect(document.documentElement.classList.contains('dark')).toBe(true)
		expect(document.documentElement.style.colorScheme).toBe('dark')
	})

	it('handles blocked access to localStorage', () => {
		vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
			throw new DOMException('Access denied', 'SecurityError')
		})

		expect(() => window.eval(themeBootstrapScript)).not.toThrow()
		expect(document.documentElement.style.colorScheme).toBe('dark')
	})
})
