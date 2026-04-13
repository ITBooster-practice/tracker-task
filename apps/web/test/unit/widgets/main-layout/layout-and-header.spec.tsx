import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Header } from '@/widgets/main-layout/ui/header/header'
import { Layout } from '@/widgets/main-layout/ui/layout'
import { MainLayout } from '@/widgets/main-layout/ui/main-layout'

// ─── Мок: sub-компоненты Header ──────────────────────────────────
vi.mock('@/widgets/main-layout/ui/header/mobile-sidebar-trigger', () => ({
	MobileSidebarTrigger: () => <div data-testid='mobile-trigger' />,
}))

vi.mock('@/widgets/main-layout/ui/header/profile-menu', () => ({
	ProfileMenu: () => <div data-testid='profile-menu' />,
}))

vi.mock('@/widgets/main-layout/ui/header/sidebar-toggle', () => ({
	SidebarToggle: () => <div data-testid='sidebar-toggle' />,
}))

// ─── Мок: sub-компоненты MainLayout ──────────────────────────────
vi.mock('@/widgets/main-layout/ui/sidebar', () => ({
	Sidebar: () => <div data-testid='sidebar' />,
}))

vi.mock('@/widgets/main-layout/ui/header', () => ({
	Header: () => <div data-testid='header' />,
}))

vi.mock('@/widgets/main-layout/ui/layout', () => ({
	Layout: ({
		sidebar,
		header,
		children,
	}: {
		sidebar: React.ReactNode
		header: React.ReactNode
		children: React.ReactNode
	}) => (
		<div>
			<div data-testid='slot-sidebar'>{sidebar}</div>
			<div data-testid='slot-header'>{header}</div>
			<div data-testid='slot-children'>{children}</div>
		</div>
	),
}))

// ─── Мок: @repo/ui ───────────────────────────────────────────────
vi.mock('@repo/ui', () => ({
	Button: ({
		children,
		...props
	}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
		<button {...props}>{children}</button>
	),
	Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}))

vi.mock('@repo/ui/icons', () => ({
	Bell: () => <span data-testid='icon-bell' />,
}))

afterEach(cleanup)

// ─── Layout ──────────────────────────────────────────────────────
describe('Layout', () => {
	it('рендерит sidebar, header и children слоты', () => {
		const { unmount } = render(
			<Layout
				sidebar={<div data-testid='test-sidebar' />}
				header={<div data-testid='test-header' />}
			>
				<div data-testid='test-content'>Контент</div>
			</Layout>,
		)

		expect(screen.getByTestId('test-sidebar')).toBeDefined()
		expect(screen.getByTestId('test-header')).toBeDefined()
		expect(screen.getByTestId('test-content')).toBeDefined()

		unmount()
	})
})

// ─── Header ──────────────────────────────────────────────────────
describe('Header', () => {
	it('рендерит поле поиска', () => {
		render(<Header />)

		expect(screen.getByPlaceholderText('Поиск (пока не реализовано)')).toBeDefined()
	})

	it('рендерит кнопку уведомлений', () => {
		render(<Header />)

		expect(screen.getByRole('button', { name: 'Уведомления (заглушка)' })).toBeDefined()
	})

	it('рендерит вложенные компоненты навигации', () => {
		render(<Header />)

		expect(screen.getByTestId('mobile-trigger')).toBeDefined()
		expect(screen.getByTestId('profile-menu')).toBeDefined()
	})
})

// ─── MainLayout ──────────────────────────────────────────────────
describe('MainLayout', () => {
	it('рендерит children в нужном слоте', () => {
		render(
			<MainLayout>
				<div data-testid='page-content'>Страница</div>
			</MainLayout>,
		)

		expect(screen.getByTestId('slot-children')).toBeDefined()
		expect(screen.getByTestId('page-content')).toBeDefined()
	})
})
