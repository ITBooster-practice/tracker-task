import { beforeEach, describe, expect, it } from 'vitest'

import { useThemeStore } from '@/features/theme'

describe('useThemeStore', () => {
	beforeEach(() => {
		useThemeStore.setState({ theme: 'dark' })
	})

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
})
