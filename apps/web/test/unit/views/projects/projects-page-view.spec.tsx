import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProjectsPageView } from '@/views/projects/ui/projects-page-view'

// ─── Мок: useParams, useRouter ───────────────────────────────────
const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush }),
	useParams: () => ({ id: 'team-1' }),
}))

// ─── Мок: useTeamDetail ──────────────────────────────────────────
vi.mock('@/shared/api/use-teams', () => ({
	useTeamDetail: () => ({ data: { name: 'Alpha Team' } }),
}))

// ─── Мок: projectCatalog и утилиты ───────────────────────────────
vi.mock('@/shared/lib/projects', () => ({
	projectCatalog: [
		{
			id: 'project-1',
			code: 'PRJ',
			name: 'Первый проект',
			description: 'Описание первого',
			boardsCount: 1,
			tasksCount: 5,
			boards: [],
			recentTasks: [],
		},
		{
			id: 'project-2',
			code: 'SND',
			name: 'Второй проект',
			description: 'Описание второго',
			boardsCount: 0,
			tasksCount: 0,
			boards: [],
			recentTasks: [],
		},
	],
	buildTeamProjectHref: (teamId: string, projectId: string) =>
		`/teams/${teamId}/projects/${projectId}`,
	createProjectId: vi.fn().mockReturnValue('project-new'),
}))

// ─── Мок: UI-компоненты ──────────────────────────────────────────
vi.mock('@repo/ui', () => ({
	Button: ({
		children,
		...props
	}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
		<button {...props}>{children}</button>
	),
	Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
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

// ─── Мок: дочерние компоненты ────────────────────────────────────
vi.mock('@/views/projects/ui/project-card', () => ({
	ProjectCard: ({
		project,
		onOpen,
	}: {
		project: { id: string; name: string; code: string }
		onOpen: (project: { id: string; name: string; code: string }) => void
	}) => (
		<button data-testid={`project-card-${project.id}`} onClick={() => onOpen(project)}>
			{project.name} ({project.code})
		</button>
	),
}))

vi.mock('@/views/projects/ui/create-project-dialog', () => ({
	CreateProjectDialog: ({
		onCreate,
	}: {
		open: boolean
		onOpenChange: (v: boolean) => void
		onCreate: (data: { name: string; code: string }) => void
	}) => (
		<button
			data-testid='create-dialog-submit'
			onClick={() => onCreate({ name: 'Тест проект', code: 'TP' })}
		>
			Создать
		</button>
	),
}))

describe('ProjectsPageView', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(cleanup)

	it('рендерит карточки всех проектов', () => {
		render(<ProjectsPageView />)

		expect(screen.getByTestId('project-card-project-1')).toBeDefined()
		expect(screen.getByTestId('project-card-project-2')).toBeDefined()
	})

	it('отображает название команды', () => {
		render(<ProjectsPageView />)

		expect(screen.getByText('Alpha Team')).toBeDefined()
	})

	it('поиск по названию фильтрует проекты', () => {
		render(<ProjectsPageView />)

		fireEvent.change(screen.getByPlaceholderText('Поиск проектов...'), {
			target: { value: 'Первый' },
		})

		expect(screen.getByTestId('project-card-project-1')).toBeDefined()
		expect(screen.queryByTestId('project-card-project-2')).toBeNull()
	})

	it('поиск по коду фильтрует проекты', () => {
		render(<ProjectsPageView />)

		fireEvent.change(screen.getByPlaceholderText('Поиск проектов...'), {
			target: { value: 'snd' },
		})

		expect(screen.queryByTestId('project-card-project-1')).toBeNull()
		expect(screen.getByTestId('project-card-project-2')).toBeDefined()
	})

	it('нет совпадений — показывает empty state', () => {
		render(<ProjectsPageView />)

		fireEvent.change(screen.getByPlaceholderText('Поиск проектов...'), {
			target: { value: 'несуществующий запрос' },
		})

		expect(screen.getByTestId('empty-state')).toBeDefined()
		expect(screen.getByText('Проекты не найдены')).toBeDefined()
	})

	it('кнопка "Создать проект" присутствует', () => {
		render(<ProjectsPageView />)

		const buttons = screen.getAllByRole('button')
		const createButton = buttons.find((btn) =>
			btn.textContent?.includes('Создать проект'),
		)
		expect(createButton).toBeDefined()
	})

	it('клик по ProjectCard → router.push с корректным путём', () => {
		render(<ProjectsPageView />)

		fireEvent.click(screen.getByTestId('project-card-project-1'))

		expect(mockPush).toHaveBeenCalledWith('/teams/team-1/projects/project-1')
	})

	it('onCreate в CreateProjectDialog → добавляет проект в список', () => {
		render(<ProjectsPageView />)

		fireEvent.click(screen.getByTestId('create-dialog-submit'))

		expect(screen.getByText('Тест проект (TP)')).toBeDefined()
	})
})
