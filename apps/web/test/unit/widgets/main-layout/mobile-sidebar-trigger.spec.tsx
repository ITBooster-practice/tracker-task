import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MobileSidebarTrigger } from '@/widgets/main-layout/ui/header/mobile-sidebar-trigger'

vi.mock('@repo/ui', () => ({
	Button: ({
		children,
		...props
	}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
		<button {...props}>{children}</button>
	),
	Sheet: ({
		children,
		open,
		onOpenChange,
	}: React.PropsWithChildren<{ open: boolean; onOpenChange: (v: boolean) => void }>) => (
		<div data-testid='sheet' data-open={String(open)}>
			{React.Children.map(children, (child) =>
				React.isValidElement(child)
					? React.cloneElement(
							child as React.ReactElement<{ onOpenChange?: (v: boolean) => void }>,
							{ onOpenChange },
						)
					: child,
			)}
		</div>
	),
	SheetTrigger: ({
		children,
		onOpenChange,
	}: React.PropsWithChildren<{
		asChild?: boolean
		onOpenChange?: (v: boolean) => void
	}>) => <div onClick={() => onOpenChange?.(true)}>{children}</div>,
	SheetContent: ({ children }: React.PropsWithChildren) => (
		<div data-testid='sheet-content'>{children}</div>
	),
	SheetHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	SheetTitle: ({ children }: React.PropsWithChildren) => <h2>{children}</h2>,
}))

vi.mock('@repo/ui/icons', () => ({
	SidebarOpen: () => <span data-testid='sidebar-open-icon' />,
}))

vi.mock('@/widgets/main-layout/ui/sidebar', () => ({
	Sidebar: () => <nav data-testid='sidebar' />,
}))

describe('MobileSidebarTrigger', () => {
	afterEach(cleanup)

	it('рендерит кнопку с aria-label', () => {
		render(<MobileSidebarTrigger />)

		expect(screen.getByRole('button', { name: 'Открыть sidebar' })).toBeDefined()
	})

	it('начальное состояние — aria-expanded=false', () => {
		render(<MobileSidebarTrigger />)

		const button = screen.getByRole('button', { name: 'Открыть sidebar' })
		expect(button.getAttribute('aria-expanded')).toBe('false')
	})

	it('клик по триггеру открывает sheet — aria-expanded=true', () => {
		render(<MobileSidebarTrigger />)

		const trigger = screen.getByRole('button', { name: 'Открыть sidebar' }).parentElement!
		fireEvent.click(trigger)

		const button = screen.getByRole('button', { name: 'Открыть sidebar' })
		expect(button.getAttribute('aria-expanded')).toBe('true')
	})
})
