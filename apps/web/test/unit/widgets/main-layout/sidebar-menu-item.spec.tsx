import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { LucideIcon } from '@repo/ui/icons'

import type { SidebarNavItem } from '@/widgets/main-layout/model/sidebar'
import { SidebarMenuItem } from '@/widgets/main-layout/ui/sidebar/sidebar-menu-item'

vi.mock('next/link', () => ({
	default: ({
		children,
		href,
		...props
	}: React.PropsWithChildren<{ href: string; [key: string]: unknown }>) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}))

const TestIcon = () => <span data-testid='icon' />

const createItem = (overrides?: Partial<SidebarNavItem>): SidebarNavItem => ({
	href: '/teams',
	title: 'Команды',
	icon: TestIcon as unknown as LucideIcon,
	iconClassName: undefined,
	...overrides,
})

describe('SidebarMenuItem', () => {
	beforeEach(() =>
		vi.stubGlobal(
			'ResizeObserver',
			class {
				observe() {}
				unobserve() {}
				disconnect() {}
			},
		),
	)
	afterEach(() => {
		cleanup()
		vi.unstubAllGlobals()
	})

	it('рендерит ссылку с правильным href', () => {
		render(<SidebarMenuItem {...createItem()} isOpen={true} />)

		expect(screen.getByRole('link').getAttribute('href')).toBe('/teams')
	})

	it('показывает label когда sidebar открыт', () => {
		render(<SidebarMenuItem {...createItem()} isOpen={true} />)

		expect(screen.getByText('Команды')).toBeDefined()
	})

	it('скрывает label когда sidebar закрыт', () => {
		render(<SidebarMenuItem {...createItem()} isOpen={false} />)

		expect(screen.queryByText('Команды')).toBeNull()
	})

	it('рендерит иконку', () => {
		render(<SidebarMenuItem {...createItem()} isOpen={true} />)

		expect(screen.getByTestId('icon')).toBeDefined()
	})

	it('активный элемент имеет title=undefined (подсказка скрыта)', () => {
		render(<SidebarMenuItem {...createItem()} isOpen={true} isActive={true} />)

		// Когда sidebar открыт, title не нужен (он виден как текст)
		expect(screen.getByRole('link').getAttribute('title')).toBeNull()
		expect(screen.getByRole('link').getAttribute('aria-current')).toBe('page')
	})

	it.each(['hover', 'focus'])(
		'uses a tooltip instead of a native title on %s',
		async (event) => {
			render(<SidebarMenuItem {...createItem()} isOpen={false} />)
			const link = screen.getByRole('link')
			expect(link.getAttribute('title')).toBeNull()
			if (event === 'hover') fireEvent.pointerMove(link, { pointerType: 'mouse' })
			else fireEvent.focus(link)
			expect((await screen.findByRole('tooltip')).textContent).toBe('Команды')
		},
	)
	it.each([true, false])(
		'explains unavailable entries by focus and touch without navigating (expanded %s)',
		async (isOpen) => {
			const onNavigate = vi.fn()
			render(
				<SidebarMenuItem
					{...createItem({
						href: undefined,
						title: 'Доска',
						disabledReason: 'Сначала выберите проект',
					})}
					isOpen={isOpen}
					onNavigate={onNavigate}
				/>,
			)
			const item = screen.getByRole('button', { name: 'Доска' })
			expect(item.getAttribute('aria-disabled')).toBe('true')
			expect(screen.queryByRole('link')).toBeNull()
			fireEvent.focus(item)
			expect((await screen.findByRole('tooltip')).textContent).toContain(
				'Сначала выберите проект',
			)
			fireEvent.click(item)
			expect((await screen.findByRole('tooltip')).textContent).toContain(
				'Сначала выберите проект',
			)
			expect(onNavigate).not.toHaveBeenCalled()
		},
	)
})
