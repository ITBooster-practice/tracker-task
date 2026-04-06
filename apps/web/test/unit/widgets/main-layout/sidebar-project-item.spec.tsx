import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SidebarProjectItem } from '@/widgets/main-layout/ui/sidebar/sidebar-project-item'

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

const defaultProps = {
	id: 'proj-1',
	shortName: 'MP',
	title: 'Мой проект',
	href: '/teams/t1/projects/p1',
	isActive: false,
	isOpen: true,
}

describe('SidebarProjectItem', () => {
	afterEach(cleanup)

	it('рендерит shortName и title когда sidebar открыт', () => {
		render(<SidebarProjectItem {...defaultProps} />)

		expect(screen.getByText('MP')).toBeDefined()
		expect(screen.getByText('Мой проект')).toBeDefined()
	})

	it('рендерит ссылку с правильным href', () => {
		render(<SidebarProjectItem {...defaultProps} />)

		expect(screen.getByRole('link').getAttribute('href')).toBe('/teams/t1/projects/p1')
	})

	it('не рендерится когда sidebar закрыт', () => {
		const { container } = render(<SidebarProjectItem {...defaultProps} isOpen={false} />)

		expect(container.firstChild).toBeNull()
	})
})
