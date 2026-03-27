import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useThemeStore } from '@/features/theme/model/store'
import { ThemeSync } from '@/features/theme/ui/theme-sync'

describe('ThemeSync', () => {
	beforeEach(() => {
		useThemeStore.setState({ theme: 'dark' })

		document.documentElement.className = ''
		document.documentElement.style.colorScheme = ''
	})

	afterEach(cleanup)

	it('добавляет класс "dark" при тёмной теме', () => {
		render(<ThemeSync />)

		expect(document.documentElement.classList.contains('dark')).toBe(true)
	})

	it('устанавливает colorScheme = "dark"', () => {
		render(<ThemeSync />)

		expect(document.documentElement.style.colorScheme).toBe('dark')
	})

	it('убирает класс "dark" при светлой теме', () => {
		useThemeStore.setState({ theme: 'light' })

		render(<ThemeSync />)

		expect(document.documentElement.classList.contains('dark')).toBe(false)
	})

	it('устанавливает colorScheme = "light"', () => {
		useThemeStore.setState({ theme: 'light' })

		render(<ThemeSync />)

		expect(document.documentElement.style.colorScheme).toBe('light')
	})

	it('не рендерит UI (возвращает null)', () => {
		const { container } = render(<ThemeSync />)

		expect(container.innerHTML).toBe('')
	})
})
