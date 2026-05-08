import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Project } from '@repo/types'

import { ProjectsPageView } from '@/views/projects/ui/projects-page-view'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush }),
	useParams: () => ({ id: 'team-1' }),
}))

vi.mock('@/shared/api/use-teams', () => ({
	useTeamsList: () => ({
		data: { data: [{ id: 'team-1', name: 'Alpha Team' }], meta: {} },
	}),
}))

const mockUseProjectsPage = vi.fn()

vi.mock('@/views/projects/model/use-projects-page', () => ({
	useProjectsPage: (...args: unknown[]) => mockUseProjectsPage(...args),
}))

vi.mock('@/shared/config', () => ({
	teamRoutes: {
		project: (teamId: string, projectId: string) =>
			`/teams/${teamId}/projects/${projectId}`,
	},
}))

vi.mock('@repo/ui', () => ({
	Button: ({
		children,
		...props
	}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
		<button {...props}>{children}</button>
	),
	Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
	CardSkeleton: () => <div data-testid='card-skeleton' />,
	EmptyState: ({
		title,
		action,
	}: {
		title: string
		description?: string
		action?: React.ReactNode
		icon?: React.ReactNode
		className?: string
	}) => (
		<div data-testid='empty-state'>
			<p>{title}</p>
			{action}
		</div>
	),
}))

vi.mock('@repo/ui/icons', () => ({
	Plus: () => <span />,
	Search: () => <span />,
	FolderKanban: () => <span />,
}))

vi.mock('@/views/projects/ui/project-card', () => ({
	ProjectCard: ({
		project,
		onOpen,
	}: {
		project: Project
		onOpen: (project: Project) => void
	}) => (
		<button data-testid={`project-card-${project.id}`} onClick={() => onOpen(project)}>
			{project.name}
		</button>
	),
}))

vi.mock('@/views/projects/ui/create-project-dialog', () => ({
	CreateProjectDialog: () => <div data-testid='create-dialog' />,
}))

const mockProjects: Project[] = [
	{
		id: 'project-1',
		name: 'Первый проект',
		description: 'Описание первого',
		teamId: 'team-1',
		createdById: 'user-1',
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z',
	},
	{
		id: 'project-2',
		name: 'Второй проект',
		description: 'Описание второго',
		teamId: 'team-1',
		createdById: 'user-1',
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z',
	},
]

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	})
	const Wrapper = ({ children }: React.PropsWithChildren) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	)
	Wrapper.displayName = 'ProjectsPageViewWrapper'
	return Wrapper
}

describe('ProjectsPageView', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockUseProjectsPage.mockReturnValue({
			allProjects: mockProjects,
			filteredProjects: mockProjects,
			isLoading: false,
			isError: false,
			searchQuery: '',
			setSearchQuery: vi.fn(),
			refetch: vi.fn(),
		})
	})

	afterEach(cleanup)

	it('рендерит карточки всех проектов', () => {
		render(<ProjectsPageView />, { wrapper: createWrapper() })

		expect(screen.getByTestId('project-card-project-1')).toBeDefined()
		expect(screen.getByTestId('project-card-project-2')).toBeDefined()
	})

	it('отображает название команды', () => {
		render(<ProjectsPageView />, { wrapper: createWrapper() })

		expect(screen.getByText('Alpha Team')).toBeDefined()
	})

	it('кнопка "Создать проект" присутствует', () => {
		render(<ProjectsPageView />, { wrapper: createWrapper() })

		const buttons = screen.getAllByRole('button')
		expect(
			buttons.find((btn) => btn.textContent?.includes('Создать проект')),
		).toBeDefined()
	})

	it('клик по ProjectCard → router.push с корректным путём', () => {
		render(<ProjectsPageView />, { wrapper: createWrapper() })

		fireEvent.click(screen.getByTestId('project-card-project-1'))

		expect(mockPush).toHaveBeenCalledWith('/teams/team-1/projects/project-1')
	})

	it('isLoading — показывает скелетоны', () => {
		mockUseProjectsPage.mockReturnValueOnce({
			allProjects: [],
			filteredProjects: [],
			isLoading: true,
			isError: false,
			searchQuery: '',
			setSearchQuery: vi.fn(),
			refetch: vi.fn(),
		})

		render(<ProjectsPageView />, { wrapper: createWrapper() })

		expect(screen.getAllByTestId('card-skeleton').length).toBeGreaterThan(0)
	})

	it('isError — показывает EmptyState с кнопкой повтора', () => {
		mockUseProjectsPage.mockReturnValueOnce({
			allProjects: [],
			filteredProjects: [],
			isLoading: false,
			isError: true,
			searchQuery: '',
			setSearchQuery: vi.fn(),
			refetch: vi.fn(),
		})

		render(<ProjectsPageView />, { wrapper: createWrapper() })

		expect(screen.getByTestId('empty-state')).toBeDefined()
		expect(screen.getByText('Не удалось загрузить проекты')).toBeDefined()
	})

	it('нет проектов — показывает "У команды ещё нет проектов"', () => {
		mockUseProjectsPage.mockReturnValueOnce({
			allProjects: [],
			filteredProjects: [],
			isLoading: false,
			isError: false,
			searchQuery: '',
			setSearchQuery: vi.fn(),
			refetch: vi.fn(),
		})

		render(<ProjectsPageView />, { wrapper: createWrapper() })

		expect(screen.getByText('У команды ещё нет проектов')).toBeDefined()
	})
})
