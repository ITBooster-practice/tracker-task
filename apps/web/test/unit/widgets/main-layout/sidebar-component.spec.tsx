import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSideBarStore } from '@/widgets/main-layout/model/sidebar'
import { Sidebar } from '@/widgets/main-layout/ui/sidebar'

vi.mock('next/link', () => ({
	default: ({
		href,
		children,
		className,
		onClick,
	}: React.PropsWithChildren<{
		href: string
		className?: string
		onClick?: () => void
	}>) => (
		<a href={href} className={className} onClick={onClick}>
			{children}
		</a>
	),
}))

const mockUsePathname = vi.fn()
const mockUseParams = vi.fn()
const mockRouterPush = vi.fn()

vi.mock('next/navigation', () => ({
	usePathname: () => mockUsePathname(),
	useParams: () => mockUseParams(),
	useRouter: () => ({ push: mockRouterPush }),
}))

vi.mock('@/features/theme', () => ({
	ThemeToggle: () => <button data-testid='theme-toggle' />,
}))

const mockUseTeamsList = vi.fn()
const mockUseMe = vi.fn()

vi.mock('@/shared/api/use-teams', () => ({
	useTeamsList: () => mockUseTeamsList(),
}))

vi.mock('@/shared/api/use-auth', () => ({
	useMe: () => mockUseMe(),
}))

vi.mock('@/shared/config', () => ({
	getSidebarRouteId: () => null,
	ROUTES: { home: '/' },
	teamRoutes: {
		projects: (id: string) => `/teams/${id}/projects`,
		project: (teamId: string, projectId: string) =>
			`/teams/${teamId}/projects/${projectId}`,
	},
}))

vi.mock('@/shared/api/use-projects', () => ({
	useProjectsList: () => ({ data: { data: [], meta: {} } }),
}))

vi.mock('@/widgets/main-layout/model/sidebar', async (importOriginal) => {
	const original =
		await importOriginal<typeof import('@/widgets/main-layout/model/sidebar')>()

	return {
		...original,
		getSidebarSections: () => [
			{
				title: 'Работа',
				items: [
					{
						title: 'Доска',
						href: '/boards',
						routeId: 'boards',
						icon: () => <span />,
					},
				],
			},
		],
		sidebarWorkspace: { title: 'Tracker Task', subtitle: 'Product Team' },
		sidebarCurrentUser: { initials: 'AI', name: 'Алексей Иванов', role: 'Owner' },
	}
})

vi.mock('@/widgets/main-layout/ui/sidebar/sidebar-menu-item', () => ({
	SidebarMenuItem: ({
		title,
		isActive,
	}: {
		title: string
		isActive: boolean
		isOpen: boolean
		href: string
		onNavigate?: () => void
	}) => (
		<div data-testid='menu-item' data-active={String(isActive)}>
			{title}
		</div>
	),
}))

vi.mock('@/widgets/main-layout/ui/sidebar/sidebar-selector', () => ({
	SidebarSelector: ({
		label,
		value,
	}: {
		label: string
		value: string
		shortValue: string
		options: unknown[]
		activeId: string | null
		isOpen: boolean
		onSelect: (id: string) => void
	}) => (
		<div data-testid='sidebar-selector'>
			<span>{label}</span>
			<span>{value}</span>
		</div>
	),
}))

vi.mock('@repo/ui', () => ({
	Avatar: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	AvatarFallback: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
	cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}))

vi.mock('@repo/ui/icons', () => ({
	KanbanSquare: () => <span data-testid='kanban-icon' />,
}))

describe('Sidebar', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockUsePathname.mockReturnValue('/')
		mockUseParams.mockReturnValue({})
		mockUseTeamsList.mockReturnValue({
			data: { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } },
		})
		mockUseMe.mockReturnValue({
			data: {
				id: 'user-1',
				name: 'Alex Real',
				email: 'alex.real@test.dev',
			},
		})
		useSideBarStore.setState({ isOpen: true })
	})

	afterEach(cleanup)

	it('развёрнутый (forceOpen=true) — показывает заголовок workspace', () => {
		render(<Sidebar forceOpen={true} />)

		expect(screen.getByText('Tracker Task')).toBeDefined()
	})

	it('свёрнутый (forceOpen=false) — скрывает заголовок workspace', () => {
		render(<Sidebar forceOpen={false} />)

		expect(screen.queryByText('Tracker Task')).toBeNull()
	})

	it('показывает имя текущей команды в селекторе команды', () => {
		mockUseParams.mockReturnValue({ id: 'team-1' })
		mockUseTeamsList.mockReturnValue({
			data: {
				data: [
					{
						id: 'team-1',
						name: 'Design Team',
						description: null,
						avatarUrl: null,
						membersCount: 5,
						currentUserRole: 'MEMBER',
						createdAt: '2024-01-01',
						updatedAt: '2024-01-01',
					},
				],
				meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
			},
		})

		render(<Sidebar forceOpen={true} />)

		expect(screen.getByText('Design Team')).toBeDefined()
	})

	it('показывает реальное имя пользователя внизу sidebar', () => {
		render(<Sidebar forceOpen={true} />)

		expect(screen.getByText('Alex Real')).toBeDefined()
	})
})
