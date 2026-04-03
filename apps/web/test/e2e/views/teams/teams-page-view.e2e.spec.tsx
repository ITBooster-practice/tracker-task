import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { TeamListItem } from '@repo/types'

import { TeamsPageView } from '@/views/teams/ui/teams-page-view'

const mockUseTeamsList = vi.fn()
const mockPush = vi.fn()

vi.mock('@/shared/api/use-teams', () => ({
	useTeamsList: () => mockUseTeamsList(),
}))

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/views/teams/ui/team-card', () => ({
	TeamCard: ({ team }: { team: { id: string; name: string } }) => (
		<div data-testid={`team-card-${team.id}`}>{team.name}</div>
	),
}))

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

describe('TeamsPageView e2e', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(cleanup)

	it('рендерит список команд из мока useTeamsList', () => {
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

	it('при isLoading=true рендерит skeleton', () => {
		mockUseTeamsList.mockReturnValue({
			data: undefined,
			isLoading: true,
			isError: false,
			refetch: vi.fn(),
		})

		render(<TeamsPageView />)

		expect(screen.getByTestId('teams-page-skeleton')).toBeDefined()
	})

	it('при пустом массиве рендерит EmptyState', () => {
		mockUseTeamsList.mockReturnValue({
			data: [],
			isLoading: false,
			isError: false,
			refetch: vi.fn(),
		})

		render(<TeamsPageView />)

		expect(screen.getByText('Нет команд')).toBeDefined()
		expect(
			screen.getByText('Создайте первую команду, чтобы начать работу.'),
		).toBeDefined()
	})

	it('кнопка создания ведёт на страницу создания команды', () => {
		mockUseTeamsList.mockReturnValue({
			data: [],
			isLoading: false,
			isError: false,
			refetch: vi.fn(),
		})

		render(<TeamsPageView />)
		fireEvent.click(screen.getAllByRole('button', { name: /создать команду/i })[0]!)

		expect(mockPush).toHaveBeenCalledWith('/teams/new')
	})
})
