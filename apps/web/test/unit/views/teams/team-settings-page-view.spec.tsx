import {
	createTeamInvitationFixture,
	createTeamMemberFixture,
} from '@/test/mocks/api/team-api.fixtures'
import {
	mockDeleteTeamMutateAsync,
	mockRemoveMemberMutateAsync,
	mockRouterReplace,
	mockSendInvitationMutateAsync,
	resetTeamSettingsPageMocks,
	setupTeamSettingsPage,
} from '@/test/mocks/views/teams/team-settings-page-view.mock'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { TEAM_ROLES } from '@repo/types'

import { TeamSettingsPageView } from '@/views/teams/ui/team-settings-page-view'

describe('TeamSettingsPageView', () => {
	beforeEach(() => {
		resetTeamSettingsPageMocks()
		setupTeamSettingsPage()
	})

	afterEach(cleanup)

	it('loading — показывает "Загрузка участников..."', () => {
		setupTeamSettingsPage({ teamPending: true })

		render(<TeamSettingsPageView />)

		expect(screen.getByText('Загрузка участников...')).toBeDefined()
	})

	it('error — показывает empty state "Не удалось загрузить команду"', () => {
		setupTeamSettingsPage({ teamError: true })

		render(<TeamSettingsPageView />)

		expect(screen.getByTestId('empty-state')).toBeDefined()
		expect(screen.getByText('Не удалось загрузить команду')).toBeDefined()
	})

	it('владелец видит кнопку приглашения и danger zone', () => {
		render(<TeamSettingsPageView />)

		expect(screen.getByRole('button', { name: 'Пригласить' })).toBeDefined()
		expect(screen.getByRole('button', { name: 'Удалить команду' })).toBeDefined()
	})

	it('отправляет приглашение без изменения регистра email', async () => {
		mockSendInvitationMutateAsync.mockResolvedValue(createTeamInvitationFixture())
		setupTeamSettingsPage({
			members: [
				createTeamMemberFixture({
					id: 'member-owner',
					userId: 'user-1',
					email: 'alex.alexandrov.1988@gmail.com',
					role: TEAM_ROLES.OWNER,
				}),
			],
		})
		render(<TeamSettingsPageView />)

		fireEvent.click(screen.getByRole('button', { name: 'Пригласить' }))
		fireEvent.change(screen.getByPlaceholderText('invite-email'), {
			target: { value: 'MadMan1988@yandex.ru' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Отправить приглашение' }))

		await waitFor(() => {
			expect(mockSendInvitationMutateAsync).toHaveBeenCalledWith({
				email: 'MadMan1988@yandex.ru',
				role: TEAM_ROLES.MEMBER,
			})
		})
	})

	it('удаляет участника по userId после подтверждения', async () => {
		mockRemoveMemberMutateAsync.mockResolvedValue({
			message: 'ok',
		})
		render(<TeamSettingsPageView />)

		fireEvent.click(screen.getByRole('button', { name: 'Удалить MadMan1988@yandex.ru' }))
		fireEvent.click(screen.getByRole('button', { name: 'Удалить' }))

		await waitFor(() => {
			expect(mockRemoveMemberMutateAsync).toHaveBeenCalledWith('user-2')
		})
	})

	it('удаляет команду после подтверждения', async () => {
		mockDeleteTeamMutateAsync.mockResolvedValue({
			message: 'Команда удалена',
		})
		render(<TeamSettingsPageView />)

		fireEvent.click(screen.getByRole('button', { name: 'Удалить команду' }))
		fireEvent.click(screen.getAllByRole('button', { name: 'Удалить команду' })[1]!)

		await waitFor(() => {
			expect(mockDeleteTeamMutateAsync).toHaveBeenCalledWith('team-1')
			expect(mockRouterReplace).toHaveBeenCalledWith('/teams')
		})
	})
})
