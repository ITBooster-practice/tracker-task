import { renderWithSidebar } from '@/test/helpers/sidebar'
import { act, cleanup, fireEvent, screen } from '@testing-library/react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { writeSidebarCookie } from '@/widgets/main-layout/model/sidebar/preference'
import { SidebarStateProvider } from '@/widgets/main-layout/model/sidebar/provider'
import { createSideBarStore } from '@/widgets/main-layout/model/sidebar/store'
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

let sidebarStore: ReturnType<typeof createSideBarStore>
const render = (ui: React.ReactNode) => renderWithSidebar(ui, { sidebarStore })

describe('SidebarToggle', () => {
	beforeEach(() => {
		writeSidebarCookie(undefined)
		localStorage.removeItem('sidebar-state')
		sidebarStore = createSideBarStore()
		sidebarStore.setState({ isOpen: true })
	})

	afterEach(cleanup)

	it.each([false, true])(
		'renders the server preference %s before hydration without changing it',
		async (initialOpen) => {
			writeSidebarCookie(initialOpen)
			const view = (
				<SidebarStateProvider initialOpen={initialOpen}>
					<SidebarToggle />
				</SidebarStateProvider>
			)
			const container = document.createElement('div')
			container.innerHTML = renderToString(view)
			document.body.append(container)
			const button = container.querySelector('button')!
			expect(button.getAttribute('aria-expanded')).toBe(String(initialOpen))
			const recoverableError = vi.fn()
			let root: ReturnType<typeof hydrateRoot>
			await act(async () => {
				root = hydrateRoot(container, view, { onRecoverableError: recoverableError })
			})
			expect(container.querySelector('button')).toBe(button)
			expect(button.getAttribute('aria-expanded')).toBe(String(initialOpen))
			expect(recoverableError).not.toHaveBeenCalled()
			await act(async () => root!.unmount())
			container.remove()
		},
	)

	it('показывает SidebarClose когда sidebar открыт', () => {
		render(<SidebarToggle />)

		expect(screen.getByTestId('sidebar-close')).toBeDefined()
		expect(screen.queryByTestId('sidebar-open')).toBeNull()
	})

	it('показывает SidebarOpen когда sidebar закрыт', () => {
		sidebarStore.setState({ isOpen: false })

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

		expect(sidebarStore.getState().isOpen).toBe(false)
	})

	it('двойной клик возвращает sidebar в исходное состояние', () => {
		render(<SidebarToggle />)

		const button = screen.getByRole('button')
		fireEvent.click(button)
		fireEvent.click(button)

		expect(sidebarStore.getState().isOpen).toBe(true)
	})
})
