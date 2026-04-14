import {
	mockAcceptMutateAsync,
	mockInvitationRouterReplace,
	mockInvitationUseMyInvitations,
	resetInvitationPageViewMocks,
} from '@/test/mocks/views/invitations/invitation-page-view.mock'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { TEAM_ROLES, type MyInvitation } from '@repo/types'

import { InvitationPageView } from '@/views/invitations/ui/invitation-page-view'

function createInvitation(overrides?: Partial<MyInvitation>): MyInvitation {
	return {
		id: 'inv-1',
		email: 'MadMan1988@yandex.ru',
		role: TEAM_ROLES.MEMBER,
		token: 'token-1',
		expiresAt: '2026-04-20T10:00:00.000Z',
		createdAt: '2026-04-10T10:00:00.000Z',
		team: {
			id: 'team-1',
			name: 'Marketing Team',
			avatarUrl: null,
		},
		invitedBy: {
			id: 'user-1',
			name: 'Alex',
			email: 'alex.alexandrov.1988@gmail.com',
		},
		...overrides,
	}
}

describe('InvitationPageView', () => {
	beforeEach(() => {
		resetInvitationPageViewMocks()
		mockInvitationUseMyInvitations.mockReturnValue({
			data: [createInvitation()],
			isLoading: false,
			isError: false,
		})
		mockAcceptMutateAsync.mockResolvedValue({
			id: 'team-1',
			name: 'Marketing Team',
		})
	})

	afterEach(cleanup)

	it('не показывает empty state во время перехода после принятия приглашения', async () => {
		let invitations: MyInvitation[] = [createInvitation()]

		mockInvitationUseMyInvitations.mockImplementation(() => ({
			data: invitations,
			isLoading: false,
			isError: false,
		}))

		mockAcceptMutateAsync.mockImplementation(async () => {
			invitations = []
			return {
				id: 'team-1',
				name: 'Marketing Team',
			}
		})

		const { rerender } = render(<InvitationPageView hasAuthSession token='token-1' />)

		fireEvent.click(screen.getByRole('button', { name: 'Принять приглашение' }))

		await waitFor(() => {
			expect(mockAcceptMutateAsync).toHaveBeenCalledWith('token-1')
		})

		rerender(<InvitationPageView hasAuthSession token='token-1' />)

		expect(screen.queryByText('Приглашение недоступно')).toBeNull()
		expect(screen.getByText('Marketing Team')).toBeDefined()
		expect(mockInvitationRouterReplace).toHaveBeenCalledWith('/teams/team-1/projects')
	})
})
