import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProjectDetailPageView } from '@/views/projects/ui/project-detail-page-view'

// ─── Мок: next/link ──────────────────────────────────────────────
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

// ─── Мок: useParams ──────────────────────────────────────────────
vi.mock('next/navigation', () => ({
	useParams: () => ({ id: 'team-1', projectId: 'my-project' }),
}))

// ─── Мок: useTeamDetail ──────────────────────────────────────────
vi.mock('@/shared/api/use-teams', () => ({
	useTeamDetail: () => ({ data: { id: 'team-1', name: 'Alpha Team' } }),
}))

// ─── Мок: teamRoutes ─────────────────────────────────────────────
vi.mock('@/shared/config', () => ({
	teamRoutes: {
		projects: (teamId: string) => `/teams/${teamId}/projects`,
	},
}))

// ─── Мок: getProjectById ─────────────────────────────────────────
const mockGetProjectById = vi.fn()

vi.mock('@/shared/lib/projects', () => ({
	getProjectById: (id: string) => mockGetProjectById(id),
	formatProjectNameFromId: (id: string) =>
		id
			.split('-')
			.map((part) => part[0]?.toUpperCase() + part.slice(1))
			.join(' '),
}))

// ─── Мок: UI-компоненты ──────────────────────────────────────────
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

describe('ProjectDetailPageView', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(cleanup)

	it('breadcrumb — показывает имя команды как ссылку и название проекта', () => {
		mockGetProjectById.mockReturnValue({
			id: 'my-project',
			name: 'My Project',
			description: 'Описание',
			boards: [],
			recentTasks: [],
		})

		render(<ProjectDetailPageView />)

		const teamLink = screen.getByRole('link', { name: 'Alpha Team' })
		expect(teamLink).toBeDefined()
		expect(teamLink.getAttribute('href')).toBe('/teams/team-1/projects')
		expect(screen.getByRole('heading', { name: 'My Project' })).toBeDefined()
	})

	it('доски — пустое состояние когда boards: []', () => {
		mockGetProjectById.mockReturnValue({
			id: 'my-project',
			name: 'My Project',
			description: 'Описание',
			boards: [],
			recentTasks: [],
		})

		render(<ProjectDetailPageView />)

		expect(
			screen.getByText('Пока нет досок. Создайте первую доску для проекта.'),
		).toBeDefined()
	})

	it('последние задачи — рендерит ключ, заголовок и инициалы исполнителя', () => {
		mockGetProjectById.mockReturnValue({
			id: 'my-project',
			name: 'My Project',
			description: 'Описание',
			boards: [],
			recentTasks: [
				{ id: 'task-1', key: 'MP-1', title: 'Настроить CI', assigneeInitials: 'AB' },
				{ id: 'task-2', key: 'MP-2', title: 'Написать тесты', assigneeInitials: 'CD' },
			],
		})

		render(<ProjectDetailPageView />)

		expect(screen.getByText('MP-1')).toBeDefined()
		expect(screen.getByText('Настроить CI')).toBeDefined()
		expect(screen.getByText('AB')).toBeDefined()
		expect(screen.getByText('MP-2')).toBeDefined()
		expect(screen.getByText('Написать тесты')).toBeDefined()
		expect(screen.getByText('CD')).toBeDefined()
	})
})
