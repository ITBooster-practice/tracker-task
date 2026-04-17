import {
	mockProfileAcceptMutateAsync,
	mockProfileDeclineMutateAsync,
	mockProfileRouterPush,
	mockProfileToastInfo,
	mockProfileToastSuccess,
	mockProfileUseMe,
	mockProfileUseMyInvitations,
	mockProfileUseTeamsList,
	resetProfilePageViewMocks,
} from '@/test/mocks/views/profile/profile-page-view.mock'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TEAM_ROLES, type MyInvitation, type TeamListItem } from '@repo/types'

import { ProfilePageView } from '@/views/profile/ui/profile-page-view'

function createTeam(overrides?: Partial<TeamListItem>): TeamListItem {
	return {
		id: 'team-1',
		name: 'Product Team',
		description: null,
		avatarUrl: null,
		membersCount: 5,
		currentUserRole: TEAM_ROLES.OWNER,
		createdAt: '2026-04-10T10:00:00.000Z',
		updatedAt: '2026-04-10T10:00:00.000Z',
		...overrides,
	}
}

function createInvitation(overrides?: Partial<MyInvitation>): MyInvitation {
	return {
		id: 'inv-1',
		email: 'alex@test.dev',
		role: TEAM_ROLES.ADMIN,
		token: 'token-1',
		expiresAt: '2026-04-20T10:00:00.000Z',
		createdAt: '2026-04-10T10:00:00.000Z',
		team: {
			id: 'team-99',
			name: 'Marketing Team',
			avatarUrl: null,
		},
		invitedBy: {
			id: 'user-2',
			name: 'Ольга Петрова',
			email: 'olga@test.dev',
		},
		...overrides,
	}
}

describe('ProfilePageView', () => {
	beforeEach(() => {
		resetProfilePageViewMocks()

		mockProfileUseMe.mockReturnValue({
			data: { id: 'user-1', name: 'Алексей Петров', email: 'alex@tracker.dev' },
			isLoading: false,
			isError: false,
			refetch: vi.fn(),
		})
		mockProfileUseTeamsList.mockReturnValue({
			data: {
				data: [
					createTeam(),
					createTeam({
						id: 'team-2',
						name: 'Design Squad',
						currentUserRole: TEAM_ROLES.ADMIN,
					}),
				],
				meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
			},
			isLoading: false,
			isError: false,
			refetch: vi.fn(),
		})
		mockProfileUseMyInvitations.mockReturnValue({
			data: [createInvitation()],
			isLoading: false,
			isError: false,
			refetch: vi.fn(),
		})
		mockProfileAcceptMutateAsync.mockResolvedValue({
			id: 'team-99',
			name: 'Marketing Team',
		})
		mockProfileDeclineMutateAsync.mockResolvedValue({})
	})

	afterEach(cleanup)

	it('рендерит профиль, команды и приглашения', () => {
		render(<ProfilePageView />)

		expect(screen.getByText('Личный кабинет')).toBeDefined()
		expect(screen.getByDisplayValue('Алексей Петров')).toBeDefined()
		expect(screen.getByDisplayValue('alex@tracker.dev')).toBeDefined()
		expect(screen.getByText('Product Team')).toBeDefined()
		expect(screen.getByText('Marketing Team')).toBeDefined()
	})

	it('клик по команде открывает страницу проектов', () => {
		render(<ProfilePageView />)

		fireEvent.click(screen.getByRole('button', { name: /Product Team/i }))

		expect(mockProfileRouterPush).toHaveBeenCalledWith('/teams/team-1/projects')
	})

	it('submit профиля без backend показывает info toast', async () => {
		render(<ProfilePageView />)

		fireEvent.change(screen.getByLabelText('Имя'), {
			target: { value: 'Алексей Петров 2' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

		await waitFor(() => {
			expect(mockProfileToastInfo).toHaveBeenCalledWith(
				'Сохранение профиля подключим после backend-части',
			)
		})
	})

	it('кнопка "Принять" вызывает accept invitation', async () => {
		render(<ProfilePageView />)

		fireEvent.click(screen.getByRole('button', { name: 'Принять' }))

		await waitFor(() => {
			expect(mockProfileAcceptMutateAsync).toHaveBeenCalledWith('token-1')
		})
		expect(mockProfileToastSuccess).toHaveBeenCalledWith(
			'Вы присоединились к команде Marketing Team',
		)
	})

	it('кнопка "Отклонить" вызывает decline invitation', async () => {
		render(<ProfilePageView />)

		fireEvent.click(screen.getByRole('button', { name: 'Отклонить' }))

		await waitFor(() => {
			expect(mockProfileDeclineMutateAsync).toHaveBeenCalledWith('token-1')
		})
		expect(mockProfileToastSuccess).toHaveBeenCalledWith('Приглашение отклонено')
	})
})
