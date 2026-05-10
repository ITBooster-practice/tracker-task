import { createTeamListItemFixture } from '@/test/mocks/teams.fixtures'
import {
	mockTeamsPagePush,
	mockUseTeamsPage,
	resetTeamsPageViewUnitMocks,
} from '@/test/mocks/views/teams/teams-page-view.unit.mock'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { mapTeamListItemToTeamCardModel } from '@/views/teams/lib/mappers'
import { TeamsPageView } from '@/views/teams/ui/teams-page-view'

describe('TeamsPageView', () => {
	beforeEach(() => {
		resetTeamsPageViewUnitMocks()
	})

	afterEach(cleanup)

	it('loading — показывает сообщение о загрузке', () => {
		mockUseTeamsPage.mockReturnValue({
			allTeams: [],
			filteredTeams: [],
			isLoading: true,
			isError: false,
			searchQuery: '',
			setSearchQuery: vi.fn(),
			refetch: vi.fn(),
			meta: undefined,
			setPage: vi.fn(),
		})
		render(<TeamsPageView />)

		expect(screen.getByTestId('teams-page-skeleton')).toBeDefined()
		expect(screen.getAllByTestId('card-skeleton')).toHaveLength(4)
	})

	it('error — показывает сообщение об ошибке', () => {
		mockUseTeamsPage.mockReturnValue({
			allTeams: [],
			filteredTeams: [],
			isLoading: false,
			isError: true,
			searchQuery: '',
			setSearchQuery: vi.fn(),
			refetch: vi.fn(),
			meta: undefined,
			setPage: vi.fn(),
		})
		render(<TeamsPageView />)

		expect(screen.getByText('Не удалось загрузить команды')).toBeDefined()
	})

	it('пустой список — показывает empty state', () => {
		mockUseTeamsPage.mockReturnValue({
			allTeams: [],
			filteredTeams: [],
			isLoading: false,
			isError: false,
			searchQuery: '',
			setSearchQuery: vi.fn(),
			refetch: vi.fn(),
			meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
			setPage: vi.fn(),
		})
		render(<TeamsPageView />)

		expect(screen.getByTestId('empty-state')).toBeDefined()
		expect(screen.getByText('Нет команд')).toBeDefined()
	})

	it('список команд — рендерит TeamCard для каждой', () => {
		const teams = [
			mapTeamListItemToTeamCardModel(
				createTeamListItemFixture({ id: 'team-1', name: 'Alpha Team' }),
			),
			mapTeamListItemToTeamCardModel(
				createTeamListItemFixture({ id: 'team-2', name: 'Beta Team' }),
			),
		]
		mockUseTeamsPage.mockReturnValue({
			allTeams: teams,
			filteredTeams: teams,
			isLoading: false,
			isError: false,
			searchQuery: '',
			setSearchQuery: vi.fn(),
			refetch: vi.fn(),
			meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
			setPage: vi.fn(),
		})
		render(<TeamsPageView />)

		expect(screen.getByTestId('team-card-team-1')).toBeDefined()
		expect(screen.getByTestId('team-card-team-2')).toBeDefined()
	})

	it('кнопка "Создать команду" → редирект на /teams/new', () => {
		mockUseTeamsPage.mockReturnValue({
			allTeams: [],
			filteredTeams: [],
			isLoading: false,
			isError: false,
			searchQuery: '',
			setSearchQuery: vi.fn(),
			refetch: vi.fn(),
			meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
			setPage: vi.fn(),
		})
		render(<TeamsPageView />)

		const buttons = screen.getAllByRole('button')
		const createButton = buttons.find((button) =>
			button.textContent?.includes('Создать команду'),
		)

		expect(createButton).toBeDefined()

		fireEvent.click(createButton!)
		expect(mockTeamsPagePush).toHaveBeenCalledWith('/teams/new')
	})

	it('клик по TeamCard → router.push на страницу проектов команды', () => {
		const teams = [
			mapTeamListItemToTeamCardModel(
				createTeamListItemFixture({ id: 'team-42', name: 'Design Team' }),
			),
		]
		mockUseTeamsPage.mockReturnValue({
			allTeams: teams,
			filteredTeams: teams,
			isLoading: false,
			isError: false,
			searchQuery: '',
			setSearchQuery: vi.fn(),
			refetch: vi.fn(),
			meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
			setPage: vi.fn(),
		})
		render(<TeamsPageView />)

		fireEvent.click(screen.getByTestId('team-card-team-42'))

		expect(mockTeamsPagePush).toHaveBeenCalledWith(expect.stringContaining('team-42'))
	})

	it('error — кнопка "Повторить" вызывает refetch', () => {
		const mockRefetch = vi.fn()
		mockUseTeamsPage.mockReturnValue({
			allTeams: [],
			filteredTeams: [],
			isLoading: false,
			isError: true,
			searchQuery: '',
			setSearchQuery: vi.fn(),
			refetch: mockRefetch,
			meta: undefined,
			setPage: vi.fn(),
		})
		render(<TeamsPageView />)

		fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))

		expect(mockRefetch).toHaveBeenCalledOnce()
	})
})
