import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProjectDetailPageView } from '@/views/projects/ui/project-detail-page-view'

const mockUseProjectDetail = vi.fn()

vi.mock('next/link', () => ({
	default: ({
		href,
		children,
		className,
	}: React.PropsWithChildren<{ href: string; className?: string }>) => (
		<a href={href} className={className}>
			{children}
		</a>
	),
}))

vi.mock('next/navigation', () => ({
	useParams: () => ({ id: 'team-1', projectId: 'project-uuid-1' }),
	useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/shared/api/use-projects', () => ({
	useProjectDetail: (...args: unknown[]) => mockUseProjectDetail(...args),
	useDeleteProject: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('@/shared/config', () => ({
	ROUTES: { teams: '/teams' },
	teamRoutes: {
		projects: (teamId: string) => `/teams/${teamId}/projects`,
	},
}))

vi.mock('@repo/ui', () => ({
	Avatar: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	AvatarFallback: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
	Button: ({
		children,
		...props
	}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
		<button {...props}>{children}</button>
	),
	ConfirmDialog: () => null,
	EmptyState: ({ title }: { title: string }) => (
		<div data-testid='empty-state'>{title}</div>
	),
	Skeleton: () => <div data-testid='skeleton' />,
	cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
	toast: { error: vi.fn(), success: vi.fn() },
}))

vi.mock('@repo/ui/icons', () => ({
	Activity: () => <span />,
	Bot: () => <span />,
	ChevronRight: () => <span />,
	FolderKanban: () => <span />,
	KanbanSquare: () => <span />,
	ListFilter: () => <span />,
	Pencil: () => <span />,
	Plus: () => <span />,
	SquareKanban: () => <span />,
	Trash2: () => <span />,
}))

vi.mock('@/views/projects/ui/edit-project-dialog', () => ({
	EditProjectDialog: () => null,
}))

vi.mock('@/shared/lib/api/utils', () => ({
	isApiError: () => false,
}))

const defaultProject = {
	id: 'project-uuid-1',
	name: 'My Project',
	description: 'Описание',
	teamId: 'team-1',
	createdById: 'user-1',
	createdAt: '2026-01-01T00:00:00.000Z',
	updatedAt: '2026-01-01T00:00:00.000Z',
}

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	})
	const Wrapper = ({ children }: React.PropsWithChildren) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	)
	Wrapper.displayName = 'ProjectDetailWrapper'
	return Wrapper
}

describe('ProjectDetailPageView', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockUseProjectDetail.mockReturnValue({
			data: defaultProject,
			isLoading: false,
			isError: false,
			refetch: vi.fn(),
		})
	})

	afterEach(cleanup)

	it('breadcrumb — показывает Команды, Проекты и название проекта', () => {
		render(<ProjectDetailPageView />, { wrapper: createWrapper() })

		const teamsLink = screen.getByRole('link', { name: 'Команды' })
		expect(teamsLink.getAttribute('href')).toBe('/teams')

		const projectsLink = screen.getByRole('link', { name: 'Проекты' })
		expect(projectsLink.getAttribute('href')).toBe('/teams/team-1/projects')

		expect(screen.getByRole('heading', { name: 'My Project' })).toBeDefined()
	})

	it('доски — пустое состояние', () => {
		render(<ProjectDetailPageView />, { wrapper: createWrapper() })

		expect(
			screen.getByText('Пока нет досок. Создайте первую доску для проекта.'),
		).toBeDefined()
	})

	it('loading — показывает skeleton', () => {
		mockUseProjectDetail.mockReturnValue({
			data: undefined,
			isLoading: true,
			isError: false,
			refetch: vi.fn(),
		})

		render(<ProjectDetailPageView />, { wrapper: createWrapper() })

		expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
	})

	it('error — показывает EmptyState с сообщением об ошибке', () => {
		mockUseProjectDetail.mockReturnValue({
			data: undefined,
			isLoading: false,
			isError: true,
			refetch: vi.fn(),
		})

		render(<ProjectDetailPageView />, { wrapper: createWrapper() })

		expect(screen.getByTestId('empty-state')).toBeDefined()
		expect(screen.getByText('Не удалось загрузить проект')).toBeDefined()
	})
})
