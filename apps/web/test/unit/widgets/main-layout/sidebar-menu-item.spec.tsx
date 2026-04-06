import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { LucideIcon } from '@repo/ui/icons'

import type { SidebarNavItem } from '@/widgets/main-layout/model/sidebar'
import { SidebarMenuItem } from '@/widgets/main-layout/ui/sidebar/sidebar-menu-item'

vi.mock('@repo/ui', () => ({
	cn: (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(' '),
}))

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
	afterEach(cleanup)

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
	})

	it('закрытый sidebar — title показывается как tooltip', () => {
		render(<SidebarMenuItem {...createItem()} isOpen={false} />)

		expect(screen.getByRole('link').getAttribute('title')).toBe('Команды')
	})
})
