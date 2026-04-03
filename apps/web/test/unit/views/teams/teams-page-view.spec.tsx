import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { TeamListItem } from '@repo/types'

import { TeamsPageView } from '@/views/teams/ui/teams-page-view'

// ─── Мок: useTeamsList ───────────────────────────────────────────
const mockUseTeamsList = vi.fn()

vi.mock('@/shared/api/use-teams', () => ({
	useTeamsList: () => mockUseTeamsList(),
}))

// ─── Мок: useRouter ──────────────────────────────────────────────
const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush }),
}))

// ─── Мок: UI-компоненты ──────────────────────────────────────────
vi.mock('@repo/ui', () => ({
	Button: ({
		children,
		...props
	}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
		<button {...props}>{children}</button>
	),
	Skeleton: (props: React.HTMLAttributes<HTMLDivElement>) => (
		<div data-testid='skeleton' {...props} />
	),
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
	Plus: () => <span data-testid='plus-icon' />,
	Users: () => <span data-testid='users-icon' />,
}))

// ─── Мок: TeamCard ───────────────────────────────────────────────
vi.mock('@/views/teams/ui/team-card', () => ({
	TeamCard: ({ team }: { team: { id: string; name: string }; onOpen: () => void }) => (
		<div data-testid={`team-card-${team.id}`}>{team.name}</div>
	),
}))

// ─── Хелпер: создаёт TeamListItem ────────────────────────────────
const createTeamListItem = (overrides?: Partial<TeamListItem>): TeamListItem => ({
	id: 'team-1',
	name: 'Alpha Team',
	description: null,
	avatarUrl: null,
	membersCount: 3,
	currentUserRole: 'MEMBER',
	createdAt: '2024-01-01',
	updatedAt: '2024-01-01',
	...overrides,
})

describe('TeamsPageView', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(cleanup)

	it('loading — показывает сообщение о загрузке', () => {
		mockUseTeamsList.mockReturnValue({
			data: undefined,
			isLoading: true,
			isError: false,
			refetch: vi.fn(),
		})
		render(<TeamsPageView />)

		expect(screen.getByTestId('teams-page-skeleton')).toBeDefined()
		expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
	})

	it('error — показывает сообщение об ошибке', () => {
		mockUseTeamsList.mockReturnValue({
			data: undefined,
			isLoading: false,
			isError: true,
			refetch: vi.fn(),
		})
		render(<TeamsPageView />)

		expect(screen.getByText('Не удалось загрузить команды')).toBeDefined()
	})

	it('пустой список — показывает empty state', () => {
		mockUseTeamsList.mockReturnValue({
			data: [],
			isLoading: false,
			isError: false,
			refetch: vi.fn(),
		})
		render(<TeamsPageView />)

		expect(screen.getByTestId('empty-state')).toBeDefined()
		expect(screen.getByText('Нет команд')).toBeDefined()
	})

	it('список команд — рендерит TeamCard для каждой', () => {
		mockUseTeamsList.mockReturnValue({
			data: [
				createTeamListItem({ id: 'team-1', name: 'Alpha Team' }),
				createTeamListItem({ id: 'team-2', name: 'Beta Team' }),
			],
			isLoading: false,
			isError: false,
			refetch: vi.fn(),
		})
		render(<TeamsPageView />)

		expect(screen.getByTestId('team-card-team-1')).toBeDefined()
		expect(screen.getByTestId('team-card-team-2')).toBeDefined()
	})

	it('сортировка — команда с большим числом участников идёт первой', () => {
		mockUseTeamsList.mockReturnValue({
			data: [
				createTeamListItem({ id: 'small', name: 'Small Team', membersCount: 2 }),
				createTeamListItem({ id: 'big', name: 'Big Team', membersCount: 10 }),
			],
			isLoading: false,
			isError: false,
			refetch: vi.fn(),
		})
		render(<TeamsPageView />)

		const cards = screen.getAllByTestId(/^team-card-/)
		expect(cards[0]!.textContent).toBe('Big Team')
		expect(cards[1]!.textContent).toBe('Small Team')
	})

	it('кнопка "Создать команду" → редирект на /teams/new', () => {
		mockUseTeamsList.mockReturnValue({
			data: [],
			isLoading: false,
			isError: false,
			refetch: vi.fn(),
		})
		render(<TeamsPageView />)

		// Кнопка в header всегда присутствует
		const buttons = screen.getAllByRole('button')
		const createButton = buttons.find((btn) =>
			btn.textContent?.includes('Создать команду'),
		)
		expect(createButton).toBeDefined()

		fireEvent.click(createButton!)
		expect(mockPush).toHaveBeenCalledWith('/teams/new')
	})
})
