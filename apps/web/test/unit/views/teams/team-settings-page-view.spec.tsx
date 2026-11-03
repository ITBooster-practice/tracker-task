import {
	createTeamInvitationFixture,
	createTeamMemberFixture,
} from '@/test/mocks/api/team-api.fixtures'
import {
	mockChangeRoleMutateAsync,
	mockDeleteTeamMutateAsync,
	mockRemoveMemberMutateAsync,
	mockRevokeInvitationMutateAsync,
	mockRouterReplace,
	mockSendInvitationMutateAsync,
	mockTeamDetailRefetch,
	mockToastSuccess,
	resetTeamSettingsPageMocks,
	setupTeamSettingsPage,
} from '@/test/mocks/views/teams/team-settings-page-view.mock'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TEAM_ROLES } from '@repo/types'

import { TeamSettingsPageView } from '@/views/teams/ui/team-settings-page-view'

function holdDialogExit() {
	const getStyles = window.getComputedStyle.bind(window)
	vi.stubGlobal('CSS', { ...globalThis.CSS, escape: (value: string) => value })
	vi.stubGlobal('getComputedStyle', (element: Element, pseudo?: string | null) => {
		const styles = getStyles(element, pseudo)
		if (element.matches('[data-slot="dialog-content"]'))
			Object.defineProperty(styles, 'animationName', {
				get: () =>
					element.getAttribute('data-state') === 'closed' ? 'team-exit' : 'team-enter',
			})
		return styles
	})
}

function completeDialogExit(content: HTMLElement) {
	const event = new Event('animationend', { bubbles: true })
	Object.defineProperty(event, 'animationName', { value: 'team-exit' })
	fireEvent(content, event)
}

describe('TeamSettingsPageView', () => {
	beforeEach(() => {
		resetTeamSettingsPageMocks()
		setupTeamSettingsPage()
	})

	afterEach(() => {
		cleanup()
		vi.unstubAllGlobals()
	})

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

	it('retry в empty state повторно запрашивает команду', () => {
		setupTeamSettingsPage({ teamError: true })

		render(<TeamSettingsPageView />)
		fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))

		expect(mockTeamDetailRefetch).toHaveBeenCalledTimes(1)
	})

	it('владелец видит кнопку приглашения и danger zone', () => {
		render(<TeamSettingsPageView />)

		expect(screen.getByRole('button', { name: 'Пригласить' })).toBeDefined()
		expect(screen.getByRole('button', { name: 'Удалить команду' })).toBeDefined()
	})

	it('обычный участник не видит manager controls', () => {
		setupTeamSettingsPage({
			members: [
				createTeamMemberFixture({
					id: 'member-current',
					userId: 'user-1',
					email: 'alex.alexandrov.1988@gmail.com',
					role: TEAM_ROLES.MEMBER,
				}),
				createTeamMemberFixture({
					id: 'member-2',
					userId: 'user-2',
					email: 'MadMan1988@yandex.ru',
					role: TEAM_ROLES.MEMBER,
				}),
			],
		})

		render(<TeamSettingsPageView />)

		expect(screen.queryByRole('button', { name: 'Пригласить' })).toBeNull()
		expect(screen.queryByRole('button', { name: 'Удалить команду' })).toBeNull()
		expect(screen.queryByRole('button', { name: /Отозвать / })).toBeNull()
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

	it('не отправляет приглашение для email уже существующего участника', () => {
		render(<TeamSettingsPageView />)

		fireEvent.click(screen.getByRole('button', { name: 'Пригласить' }))
		fireEvent.change(screen.getByPlaceholderText('invite-email'), {
			target: { value: 'MadMan1988@yandex.ru' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Отправить приглашение' }))

		expect(mockSendInvitationMutateAsync).not.toHaveBeenCalled()
	})

	it('закрытие invite dialog сбрасывает email и переоткрывает форму пустой', () => {
		render(<TeamSettingsPageView />)

		fireEvent.click(screen.getByRole('button', { name: 'Пригласить' }))
		fireEvent.change(screen.getByPlaceholderText('invite-email'), {
			target: { value: 'invite@test.dev' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Скрыть' }))

		expect(screen.queryByPlaceholderText('invite-email')).toBeNull()

		fireEvent.click(screen.getByRole('button', { name: 'Пригласить' }))
		fireEvent.click(screen.getByRole('button', { name: 'Открыть снова' }))

		expect((screen.getByPlaceholderText('invite-email') as HTMLInputElement).value).toBe(
			'',
		)
	})

	it('смена роли участника вызывает mutation и success toast', async () => {
		mockChangeRoleMutateAsync.mockResolvedValue({ message: 'ok' })

		render(<TeamSettingsPageView />)
		fireEvent.click(
			screen.getByRole('button', {
				name: 'Сделать админом MadMan1988@yandex.ru',
			}),
		)

		await waitFor(() => {
			expect(mockChangeRoleMutateAsync).toHaveBeenCalledWith({
				userId: 'user-2',
				data: { role: TEAM_ROLES.ADMIN },
			})
			expect(mockToastSuccess).toHaveBeenCalledWith('Роль участника обновлена')
		})
	})

	it('отзывает приглашение и показывает success toast', async () => {
		const invitation = createTeamInvitationFixture({
			id: 'inv-1',
			email: 'invite@test.dev',
		})

		mockRevokeInvitationMutateAsync.mockResolvedValue({ message: 'ok' })
		setupTeamSettingsPage({ invitations: [invitation] })

		render(<TeamSettingsPageView />)
		fireEvent.click(screen.getByRole('button', { name: 'Отозвать invite@test.dev' }))

		await waitFor(() => {
			expect(mockRevokeInvitationMutateAsync).toHaveBeenCalledWith('inv-1')
			expect(mockToastSuccess).toHaveBeenCalledWith('Приглашение отозвано')
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

	it('self-remove редиректит на /teams и показывает текст выхода', async () => {
		mockRemoveMemberMutateAsync.mockResolvedValue({
			message: 'ok',
		})
		setupTeamSettingsPage({
			members: [
				createTeamMemberFixture({
					id: 'member-current',
					userId: 'user-1',
					email: 'alex.alexandrov.1988@gmail.com',
					role: TEAM_ROLES.ADMIN,
				}),
				createTeamMemberFixture({
					id: 'member-2',
					userId: 'user-2',
					email: 'MadMan1988@yandex.ru',
					role: TEAM_ROLES.MEMBER,
				}),
			],
		})

		render(<TeamSettingsPageView />)

		fireEvent.click(
			screen.getByRole('button', {
				name: 'Удалить alex.alexandrov.1988@gmail.com',
			}),
		)
		fireEvent.click(screen.getByRole('button', { name: 'Покинуть' }))

		await waitFor(() => {
			expect(mockRemoveMemberMutateAsync).toHaveBeenCalledWith('user-1')
			expect(mockToastSuccess).toHaveBeenCalledWith('Вы покинули команду')
			expect(mockRouterReplace).toHaveBeenCalledWith('/teams')
		})
	})

	it('закрытие confirm dialog очищает выбранного участника', async () => {
		render(<TeamSettingsPageView />)

		fireEvent.click(screen.getByRole('button', { name: 'Удалить MadMan1988@yandex.ru' }))
		expect(
			screen.getByRole('dialog', { name: 'Удалить участника из команды?' }),
		).toBeDefined()

		fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))

		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
	})

	it('удаляет команду после подтверждения и переходит к списку после завершения закрытия', async () => {
		holdDialogExit()
		mockDeleteTeamMutateAsync.mockResolvedValue({
			message: 'Команда удалена',
		})
		render(<TeamSettingsPageView />)

		fireEvent.click(screen.getByRole('button', { name: 'Удалить команду' }))
		fireEvent.click(screen.getByRole('button', { name: 'Удалить команду' }))

		const content = screen.getByRole('dialog')
		await waitFor(() => expect(content.getAttribute('data-state')).toBe('closed'))
		expect(mockDeleteTeamMutateAsync).toHaveBeenCalledExactlyOnceWith('team-1')
		expect(mockRouterReplace).not.toHaveBeenCalled()
		expect(content.isConnected).toBe(true)
		completeDialogExit(content)
		await waitFor(() => {
			expect(mockRouterReplace).toHaveBeenCalledExactlyOnceWith('/teams')
		})
	})
})
