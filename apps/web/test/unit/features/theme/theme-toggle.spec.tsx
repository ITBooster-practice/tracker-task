import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useThemeStore } from '@/features/theme/model/store'
import { ThemeToggle } from '@/features/theme/ui/theme-toggle'

vi.mock('@repo/ui', () => ({
	Button: ({
		children,
		variant,
		size,
		...props
	}: React.PropsWithChildren<
		React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }
	>) => (
		<button data-variant={variant} data-size={size} {...props}>
			{children}
		</button>
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

	it('постоянно рендерит обе иконки с видимостью по DOM-теме', () => {
		render(<ThemeToggle />)

		expect(screen.getByTestId('sun-icon').className).toContain('hidden')
		expect(screen.getByTestId('sun-icon').className).toContain('dark:block')
		expect(screen.getByTestId('moon-icon').className).toContain('dark:hidden')
		expect(screen.getByTestId('sun-icon').getAttribute('aria-hidden')).toBe('true')
		expect(screen.getByTestId('moon-icon').getAttribute('aria-hidden')).toBe('true')
	})

	it('сохраняет доступное имя кнопки в обеих темах', () => {
		const { unmount } = render(<ThemeToggle />)
		expect(screen.getByRole('button', { name: 'Переключить тему' })).toBeDefined()
		unmount()
		useThemeStore.setState({ theme: 'light' })
		render(<ThemeToggle />)

		expect(screen.getByRole('button', { name: 'Переключить тему' })).toBeDefined()
	})

	it.each(['light', 'dark'] as const)(
		'сохраняет серверную кнопку при гидратации с темой %s',
		async (theme) => {
			const container = document.createElement('div')
			container.innerHTML = renderToString(<ThemeToggle />)
			const button = container.querySelector('button')
			expect(button).not.toBeNull()
			const serverMarkup = container.innerHTML
			useThemeStore.setState({ theme })
			const onRecoverableError = vi.fn()
			const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

			let root: ReturnType<typeof hydrateRoot>
			try {
				await act(async () => {
					root = hydrateRoot(container, <ThemeToggle />, { onRecoverableError })
				})

				expect(container.querySelector('button')).toBe(button)
				expect(container.innerHTML).toBe(serverMarkup)
				expect(onRecoverableError).not.toHaveBeenCalled()
				expect(consoleError).not.toHaveBeenCalled()
			} finally {
				await act(async () => root?.unmount())
				consoleError.mockRestore()
			}
		},
	)

	it('передаёт размер и классы без изменения геометрии после клика', () => {
		render(<ThemeToggle size='icon-sm' className='shrink-0' iconClassName='size-4' />)
		const button = screen.getByRole('button')
		const markup = button.outerHTML

		fireEvent.click(button)

		expect(button.outerHTML).toBe(markup)
		expect(button.getAttribute('type')).toBe('button')
		expect(button.className).toContain('shrink-0')
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
