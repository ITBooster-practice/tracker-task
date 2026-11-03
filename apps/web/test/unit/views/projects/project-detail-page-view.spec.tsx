import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProjectDetailPageView } from '@/views/projects/ui/project-detail-page-view'
import { FeatureFlagsContext } from '@/shared/lib/feature-flags/context'

const mockUseProjectDetail = vi.fn()
const { mockPush, mockDeleteProject } = vi.hoisted(() => ({
	mockPush: vi.fn(),
	mockDeleteProject: vi.fn(),
}))

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
	useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/shared/api/use-projects', () => ({
	useProjectDetail: (...args: unknown[]) => mockUseProjectDetail(...args),
	useDeleteProject: (options?: { onDeleted?: () => void | Promise<void> }) => ({
		mutateAsync: async (...args: unknown[]) => {
			const result = await mockDeleteProject(...args)
			await options?.onDeleted?.()
			return result
		},
		isPending: false,
	}),
}))

vi.mock('@/shared/config', () => ({
	ROUTES: { teams: '/teams' },
	teamRoutes: {
		projects: (teamId: string) => `/teams/${teamId}/projects`,
		projectBoard: (teamId: string, projectId: string) =>
			`/teams/${teamId}/projects/${projectId}/board`,
	},
}))

vi.mock('@repo/ui', async (importOriginal) => ({
	...(await importOriginal<typeof import('@repo/ui')>()),
	Avatar: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	AvatarFallback: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
	Button: ({
		children,
		...props
	}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
		<button {...props}>{children}</button>
	),
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

vi.mock('@/views/boards/ui/project-boards-section', () => ({
	ProjectBoardsSection: ({
		teamId,
		projectId,
	}: {
		teamId: string
		projectId: string
	}) => <div data-testid='project-boards' data-team={teamId} data-project={projectId} />,
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

function holdDialogExit() {
	const getStyles = window.getComputedStyle.bind(window)
	vi.stubGlobal('CSS', { ...globalThis.CSS, escape: (value: string) => value })
	vi.stubGlobal('getComputedStyle', (element: Element, pseudo?: string | null) => {
		const styles = getStyles(element, pseudo)
		if (element.matches('[data-slot="dialog-content"]'))
			Object.defineProperty(styles, 'animationName', {
				get: () =>
					element.getAttribute('data-state') === 'closed'
						? 'project-exit'
						: 'project-enter',
			})
		return styles
	})
}

function completeDialogExit(content: HTMLElement) {
	const event = new Event('animationend', { bubbles: true })
	Object.defineProperty(event, 'animationName', { value: 'project-exit' })
	fireEvent(content, event)
}

describe('ProjectDetailPageView', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockDeleteProject.mockReset()
		mockUseProjectDetail.mockReturnValue({
			data: defaultProject,
			isLoading: false,
			isError: false,
			refetch: vi.fn(),
		})
	})

	afterEach(() => {
		cleanup()
		vi.unstubAllGlobals()
	})
	it('hides the AI generator until enabled and keeps the project available', () => {
		const { rerender } = render(<ProjectDetailPageView />, { wrapper: createWrapper() })
		expect(screen.queryByRole('button', { name: /AI Генератор/ })).toBeNull()
		expect(screen.getByRole('heading', { name: 'My Project' })).toBeDefined()
		rerender(
			<FeatureFlagsContext.Provider
				value={{
					snapshot: {
						version: 1,
						flags: [
							{
								key: 'ai-assistant',
								enabled: true,
								updatedAt: '2026-10-30T00:00:00.000Z',
							},
						],
					},
					status: 'ready',
					connection: 'connected',
					canManage: false,
					retry: () => {},
				}}
			>
				<ProjectDetailPageView />
			</FeatureFlagsContext.Provider>,
		)
		expect(screen.getByRole('button', { name: /AI Генератор/ })).toBeDefined()
	})

	it('открывает доску текущего проекта через проектный маршрут', () => {
		render(<ProjectDetailPageView />, { wrapper: createWrapper() })
		fireEvent.click(screen.getByRole('button', { name: /Открыть доску/ }))
		expect(mockPush).toHaveBeenCalledWith('/teams/team-1/projects/project-uuid-1/board')
	})
	it('переоткрывает отменённое подтверждение и переходит к проектам после exit удаления', async () => {
		holdDialogExit()
		mockDeleteProject.mockResolvedValue(undefined)
		render(<ProjectDetailPageView />, { wrapper: createWrapper() })
		fireEvent.click(screen.getByRole('button', { name: 'Удалить проект' }))
		let content = screen.getByRole('dialog', { name: 'Удалить проект?' })
		fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))
		expect(content.getAttribute('data-state')).toBe('closed')
		expect(mockPush).not.toHaveBeenCalled()
		completeDialogExit(content)
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
		expect(mockDeleteProject).not.toHaveBeenCalled()
		fireEvent.click(screen.getByRole('button', { name: 'Удалить проект' }))
		content = screen.getByRole('dialog', { name: 'Удалить проект?' })
		fireEvent.click(screen.getByRole('button', { name: 'Удалить' }))
		await waitFor(() => expect(content.getAttribute('data-state')).toBe('closed'))
		expect(mockDeleteProject).toHaveBeenCalledExactlyOnceWith({
			teamId: 'team-1',
			projectId: 'project-uuid-1',
		})
		expect(mockPush).not.toHaveBeenCalled()
		expect(content.isConnected).toBe(true)
		completeDialogExit(content)
		await waitFor(() =>
			expect(mockPush).toHaveBeenCalledExactlyOnceWith('/teams/team-1/projects'),
		)
	})

	it('breadcrumb — показывает Команды, Проекты и название проекта', () => {
		render(<ProjectDetailPageView />, { wrapper: createWrapper() })

		const teamsLink = screen.getByRole('link', { name: 'Команды' })
		expect(teamsLink.getAttribute('href')).toBe('/teams')

		const projectsLink = screen.getByRole('link', { name: 'Проекты' })
		expect(projectsLink.getAttribute('href')).toBe('/teams/team-1/projects')

		expect(screen.getByRole('heading', { name: 'My Project' })).toBeDefined()
	})

	it('передаёт контекст проекта в список досок', () => {
		render(<ProjectDetailPageView />, { wrapper: createWrapper() })

		expect(screen.getByTestId('project-boards').getAttribute('data-team')).toBe('team-1')
		expect(screen.getByTestId('project-boards').getAttribute('data-project')).toBe(
			'project-uuid-1',
		)
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
