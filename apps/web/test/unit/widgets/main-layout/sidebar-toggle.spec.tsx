import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSideBarStore } from '@/widgets/main-layout/model/sidebar'
import { SidebarToggle } from '@/widgets/main-layout/ui/header/sidebar-toggle'

vi.mock('@repo/ui', () => ({
	Button: ({
		children,
		...props
	}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
		<button {...props}>{children}</button>
	),
}))

vi.mock('@repo/ui/icons', () => ({
	SidebarClose: () => <span data-testid='sidebar-close' />,
	SidebarOpen: () => <span data-testid='sidebar-open' />,
}))

describe('SidebarToggle', () => {
	beforeEach(() => {
		useSideBarStore.setState({ isOpen: true })
	})

	afterEach(cleanup)

	it('показывает SidebarClose когда sidebar открыт', () => {
		render(<SidebarToggle />)

		expect(screen.getByTestId('sidebar-close')).toBeDefined()
		expect(screen.queryByTestId('sidebar-open')).toBeNull()
	})

	it('показывает SidebarOpen когда sidebar закрыт', () => {
		useSideBarStore.setState({ isOpen: false })

		render(<SidebarToggle />)

		expect(screen.getByTestId('sidebar-open')).toBeDefined()
		expect(screen.queryByTestId('sidebar-close')).toBeNull()
	})

	it('aria-expanded соответствует состоянию sidebar', () => {
		render(<SidebarToggle />)

		expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('true')
	})

	it('клик переключает sidebar', () => {
		render(<SidebarToggle />)

		fireEvent.click(screen.getByRole('button'))

		expect(useSideBarStore.getState().isOpen).toBe(false)
	})

	it('двойной клик возвращает sidebar в исходное состояние', () => {
		render(<SidebarToggle />)

		const button = screen.getByRole('button')
		fireEvent.click(button)
		fireEvent.click(button)

		expect(useSideBarStore.getState().isOpen).toBe(true)
	})
})
