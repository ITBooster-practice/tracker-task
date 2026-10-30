import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useThemeStore } from '@/features/theme'

describe('useThemeStore', () => {
	beforeEach(() => {
		useThemeStore.setState({ theme: 'dark' })
	})

	afterEach(() => vi.restoreAllMocks())

	it("начальное состояние → theme: 'dark'", () => {
		const { theme } = useThemeStore.getState()

		expect(theme).toBe('dark')
	})

	it("setTheme('light') → theme = 'light'", () => {
		useThemeStore.getState().setTheme('light')

		expect(useThemeStore.getState().theme).toBe('light')
	})

	it("toggleTheme при 'dark' → 'light'", () => {
		useThemeStore.getState().toggleTheme()

		expect(useThemeStore.getState().theme).toBe('light')
	})

	it("toggleTheme при 'light' → 'dark'", () => {
		useThemeStore.setState({ theme: 'light' })

		useThemeStore.getState().toggleTheme()

		expect(useThemeStore.getState().theme).toBe('dark')
	})

	it("persist: ключ 'theme'", () => {
		expect(useThemeStore.persist.getOptions().name).toBe('theme')
	})

	it.each(['light', 'dark'] as const)('применяет и сохраняет %s синхронно', (theme) => {
		useThemeStore.getState().setTheme(theme)

		expect(document.documentElement.classList.contains('dark')).toBe(theme === 'dark')
		expect(document.documentElement.style.colorScheme).toBe(theme)
		expect(JSON.parse(localStorage.getItem('theme')!)).toEqual({
			state: { theme },
			version: 0,
		})
	})

	it.each(['light', 'dark'] as const)('восстанавливает %s из persist', async (theme) => {
		localStorage.setItem('theme', JSON.stringify({ state: { theme }, version: 0 }))

		await useThemeStore.persist.rehydrate()

		expect(useThemeStore.getState().theme).toBe(theme)
		expect(document.documentElement.style.colorScheme).toBe(theme)
	})

	it.each([
		'not json',
		'null',
		'{"state":{"theme":null},"version":0}',
		'{"state":{"theme":"system"},"version":0}',
		'{"state":{"theme":"light"},"version":1}',
	])('игнорирует некорректное сохранённое состояние: %s', async (value) => {
		localStorage.setItem('theme', value)

		await useThemeStore.persist.rehydrate()

		expect(useThemeStore.getState().theme).toBe('dark')
		expect(document.documentElement.style.colorScheme).toBe('dark')
	})

	it('не подменяет действия данными из localStorage', async () => {
		localStorage.setItem(
			'theme',
			JSON.stringify({
				state: { theme: 'light', toggleTheme: null, setTheme: null },
				version: 0,
			}),
		)
		await useThemeStore.persist.rehydrate()

		useThemeStore.getState().toggleTheme()

		expect(useThemeStore.getState().theme).toBe('dark')
	})

	it('переключает тему при заблокированном localStorage', async () => {
		vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
			throw new DOMException('Access denied', 'SecurityError')
		})
		await useThemeStore.persist.rehydrate()

		expect(() => useThemeStore.getState().toggleTheme()).not.toThrow()
		expect(useThemeStore.getState().theme).toBe('light')
		expect(document.documentElement.style.colorScheme).toBe('light')
		expect(() => useThemeStore.persist.clearStorage()).not.toThrow()
	})

	it('переключает тему при ошибке записи в localStorage', () => {
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('Quota exceeded', 'QuotaExceededError')
		})

		expect(() => useThemeStore.getState().toggleTheme()).not.toThrow()
		expect(useThemeStore.getState().theme).toBe('light')
		expect(document.documentElement.style.colorScheme).toBe('light')
	})
})
