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
		expect(screen.getAllByTestId('card-skeleton')).toHaveLength(4)
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
			data: { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } },
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

	it('кнопка "Создать команду" → редирект на /teams/new', () => {
		mockUseTeamsList.mockReturnValue({
			data: { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } },
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
			data: {
				data: [createTeamListItemFixture({ id: 'team-42', name: 'Design Team' })],
				meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
			},
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
