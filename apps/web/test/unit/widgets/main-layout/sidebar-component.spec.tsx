import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSideBarStore } from '@/widgets/main-layout/model/sidebar'
import { Sidebar } from '@/widgets/main-layout/ui/sidebar'

// ─── Мок: next/link ──────────────────────────────────────────────
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

// ─── Мок: usePathname, useParams ─────────────────────────────────
const mockUsePathname = vi.fn()
const mockUseParams = vi.fn()

vi.mock('next/navigation', () => ({
	usePathname: () => mockUsePathname(),
	useParams: () => mockUseParams(),
}))

// ─── Мок: ThemeToggle ────────────────────────────────────────────
vi.mock('@/features/theme', () => ({
	ThemeToggle: () => <button data-testid='theme-toggle' />,
}))

// ─── Мок: useTeamsList ───────────────────────────────────────────
const mockUseTeamsList = vi.fn()
const mockUseMe = vi.fn()

vi.mock('@/shared/api/use-teams', () => ({
	useTeamsList: () => mockUseTeamsList(),
}))

vi.mock('@/shared/api/use-auth', () => ({
	useMe: () => mockUseMe(),
}))

// ─── Мок: shared/config ──────────────────────────────────────────
vi.mock('@/shared/config', () => ({
	getSidebarRouteId: () => null,
	ROUTES: { home: '/' },
}))

// ─── Мок: shared/lib/projects ────────────────────────────────────
vi.mock('@/shared/lib/projects', () => ({
	buildTeamProjectHref: (teamId: string, projectId: string) =>
		`/teams/${teamId}/projects/${projectId}`,
	projectCatalog: [],
}))

// ─── Мок: model/sidebar ──────────────────────────────────────────
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
						title: 'Проекты',
						href: '/teams/team-1/projects',
						routeId: 'team.projects',
						icon: () => <span />,
					},
				],
			},
		],
		sidebarWorkspace: { title: 'Tracker Task', subtitle: 'Product Team' },
		sidebarCurrentUser: { initials: 'AI', name: 'Алексей Иванов', role: 'Owner' },
		sidebarProjects: [],
	}
})

// ─── Мок: SidebarMenuItem / SidebarProjectItem ───────────────────
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

vi.mock('@/widgets/main-layout/ui/sidebar/sidebar-project-item', () => ({
	SidebarProjectItem: ({
		title,
	}: {
		title: string
		href: string
		isActive: boolean
		isOpen: boolean
	}) => <div data-testid='project-item'>{title}</div>,
}))

// ─── Мок: UI-компоненты ──────────────────────────────────────────
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

	it('показывает имя текущей команды под заголовком когда sidebar открыт', () => {
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
