import { createTeamListItemFixture } from '@/test/mocks/teams.fixtures'
import {
	mockTeamsPagePush,
	mockUseTeamsList,
	resetTeamsPageViewUnitMocks,
} from '@/test/mocks/views/teams/teams-page-view.unit.mock'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TeamsPageView } from '@/views/teams/ui/teams-page-view'

describe('TeamsPageView', () => {
	beforeEach(() => {
		resetTeamsPageViewUnitMocks()
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
				createTeamListItemFixture({ id: 'team-1', name: 'Alpha Team' }),
				createTeamListItemFixture({ id: 'team-2', name: 'Beta Team' }),
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
				createTeamListItemFixture({ id: 'small', name: 'Small Team', membersCount: 2 }),
				createTeamListItemFixture({ id: 'big', name: 'Big Team', membersCount: 10 }),
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

		const buttons = screen.getAllByRole('button')
		const createButton = buttons.find((button) =>
			button.textContent?.includes('Создать команду'),
		)

		expect(createButton).toBeDefined()

		fireEvent.click(createButton!)
		expect(mockTeamsPagePush).toHaveBeenCalledWith('/teams/new')
	})

	it('клик по TeamCard → router.push на страницу проектов команды', () => {
		mockUseTeamsList.mockReturnValue({
			data: [createTeamListItemFixture({ id: 'team-42', name: 'Design Team' })],
			isLoading: false,
			isError: false,
			refetch: vi.fn(),
		})
		render(<TeamsPageView />)

		fireEvent.click(screen.getByTestId('team-card-team-42'))

		expect(mockTeamsPagePush).toHaveBeenCalledWith(expect.stringContaining('team-42'))
	})

	it('error — кнопка "Повторить" вызывает refetch', () => {
		const mockRefetch = vi.fn()
		mockUseTeamsList.mockReturnValue({
			data: undefined,
			isLoading: false,
			isError: true,
			refetch: mockRefetch,
		})
		render(<TeamsPageView />)

		fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))

		expect(mockRefetch).toHaveBeenCalledOnce()
	})
})
