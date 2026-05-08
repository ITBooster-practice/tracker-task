import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProjectDetailPageView } from '@/views/projects/ui/project-detail-page-view'

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
}))

vi.mock('@/shared/api/use-teams', () => ({
	useTeamDetail: () => ({ data: { id: 'team-1', name: 'Alpha Team' } }),
}))

vi.mock('@/shared/api/use-projects', () => ({
	useProjectDetail: () => ({
		data: {
			id: 'project-uuid-1',
			name: 'My Project',
			description: 'Описание',
			teamId: 'team-1',
			createdById: 'user-1',
			createdAt: '2026-01-01T00:00:00.000Z',
			updatedAt: '2026-01-01T00:00:00.000Z',
		},
	}),
}))

vi.mock('@/shared/config', () => ({
	teamRoutes: {
		projects: (teamId: string) => `/teams/${teamId}/projects`,
	},
}))

vi.mock('@repo/ui', () => ({
	Avatar: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	AvatarFallback: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
	cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}))

vi.mock('@repo/ui/icons', () => ({
	Activity: () => <span />,
	ChevronRight: () => <span />,
	KanbanSquare: () => <span />,
	Plus: () => <span />,
	Sparkles: () => <span />,
	SquareKanban: () => <span />,
}))

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
	beforeEach(() => vi.clearAllMocks())
	afterEach(cleanup)

	it('breadcrumb — показывает имя команды как ссылку и название проекта', () => {
		render(<ProjectDetailPageView />, { wrapper: createWrapper() })

		const teamLink = screen.getByRole('link', { name: 'Alpha Team' })
		expect(teamLink).toBeDefined()
		expect(teamLink.getAttribute('href')).toBe('/teams/team-1/projects')
		expect(screen.getByRole('heading', { name: 'My Project' })).toBeDefined()
	})

	it('доски — пустое состояние', () => {
		render(<ProjectDetailPageView />, { wrapper: createWrapper() })

		expect(
			screen.getByText('Пока нет досок. Создайте первую доску для проекта.'),
		).toBeDefined()
	})

	it('задачи — пустое состояние', () => {
		render(<ProjectDetailPageView />, { wrapper: createWrapper() })

		expect(screen.getByText('В проекте пока нет задач.')).toBeDefined()
	})
})
