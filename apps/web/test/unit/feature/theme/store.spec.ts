import { beforeEach, describe, expect, it } from 'vitest'

import { useThemeStore } from '@/features/theme'

describe('useThemeStore', () => {
	// Сбрасываем store в исходное состояние перед каждым тестом
	beforeEach(() => {
		useThemeStore.setState({ theme: 'dark' })
	})

	it('дефолтное значение', () => {
		const { theme } = useThemeStore.getState()

		expect(theme).toBe('dark')
	})

	it('setTheme меняет тему', () => {
		useThemeStore.getState().setTheme('light')

		expect(useThemeStore.getState().theme).toBe('light')
	})

	it('toggleTheme: dark', () => {
		useThemeStore.getState().toggleTheme()

		expect(useThemeStore.getState().theme).toBe('light')
	})

	it('toggleTheme: light', () => {
		useThemeStore.setState({ theme: 'light' })

		useThemeStore.getState().toggleTheme()

		expect(useThemeStore.getState().theme).toBe('dark')
	})
})
