import { createTeamListItemFixture } from '@/test/mocks/teams.fixtures'
import {
	mockTeamsPagePush,
	mockUseTeamsList,
	resetTeamsPageViewE2eMocks,
} from '@/test/mocks/views/teams/teams-page-view.e2e.mock'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TeamsPageView } from '@/views/teams/ui/teams-page-view'

describe('TeamsPageView e2e', () => {
	beforeEach(() => {
		resetTeamsPageViewE2eMocks()
	})

	afterEach(cleanup)

	it('рендерит список команд из мока useTeamsList', () => {
		mockUseTeamsList.mockReturnValue({
			data: {
				data: [
					createTeamListItemFixture({ id: 'team-1', name: 'Alpha Team' }),
					createTeamListItemFixture({ id: 'team-2', name: 'Beta Team' }),
				],
				meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
			},
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
			data: { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } },
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
			data: { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } },
			isLoading: false,
			isError: false,
			refetch: vi.fn(),
		})

		render(<TeamsPageView />)
		fireEvent.click(screen.getAllByRole('button', { name: /создать команду/i })[0]!)

		expect(mockTeamsPagePush).toHaveBeenCalledWith('/teams/new')
	})
})
