import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useThemeStore } from '@/features/theme/model/store'
import { ThemeToggle } from '@/features/theme/ui/theme-toggle'

vi.mock('@repo/ui', () => ({
	Button: ({
		children,
		...props
	}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
		<button {...props}>{children}</button>
	),
	cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' '),
	SunIcon: (props: React.HTMLAttributes<HTMLSpanElement>) => (
		<span data-testid='sun-icon' {...props} />
	),
	MoonIcon: (props: React.HTMLAttributes<HTMLSpanElement>) => (
		<span data-testid='moon-icon' {...props} />
	),
}))

describe('ThemeToggle', () => {
	beforeEach(() => {
		useThemeStore.setState({ theme: 'dark' })
	})

	afterEach(cleanup)

	it('рендерит SunIcon при тёмной теме', () => {
		render(<ThemeToggle />)

		expect(screen.getByTestId('sun-icon')).toBeDefined()
		expect(screen.queryByTestId('moon-icon')).toBeNull()
	})

	it('рендерит MoonIcon при светлой теме', () => {
		useThemeStore.setState({ theme: 'light' })

		render(<ThemeToggle />)

		expect(screen.getByTestId('moon-icon')).toBeDefined()
		expect(screen.queryByTestId('sun-icon')).toBeNull()
	})

	it('aria-label для тёмной темы = "Светлая тема"', () => {
		render(<ThemeToggle />)

		const button = screen.getByRole('button')
		expect(button.getAttribute('aria-label')).toBe('Светлая тема')
	})

	it('aria-label для светлой темы = "Темная тема"', () => {
		useThemeStore.setState({ theme: 'light' })

		render(<ThemeToggle />)

		const button = screen.getByRole('button')
		expect(button.getAttribute('aria-label')).toBe('Темная тема')
	})

	it('клик переключает тему с dark на light', () => {
		render(<ThemeToggle />)

		fireEvent.click(screen.getByRole('button'))

		expect(useThemeStore.getState().theme).toBe('light')
	})

	it('два клика возвращают тему обратно', () => {
		render(<ThemeToggle />)

		const button = screen.getByRole('button')
		fireEvent.click(button)
		fireEvent.click(button)

		expect(useThemeStore.getState().theme).toBe('dark')
	})
})
