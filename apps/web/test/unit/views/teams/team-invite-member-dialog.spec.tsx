import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TEAM_ROLES } from '@repo/types'

import '@/test/mocks/views/teams/team-invite-member-dialog.mock'

import { TeamInviteMemberDialog } from '@/views/teams/ui/team-invite-member-dialog'

describe('TeamInviteMemberDialog', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(cleanup)

	it('рендерит заголовок, email и доступные роли', () => {
		const noop = () => undefined

		render(
			<TeamInviteMemberDialog
				email='new@test.dev'
				isOpen
				isPending={false}
				isSubmitDisabled={false}
				onClose={noop}
				onEmailChange={noop}
				onOpenChange={noop}
				onRoleChange={noop}
				onSubmit={noop}
				role={TEAM_ROLES.MEMBER}
			/>,
		)

		expect(screen.getByTestId('dialog-root')).toBeDefined()
		expect(screen.getByText('Пригласить участника')).toBeDefined()
		expect(screen.getByDisplayValue('new@test.dev')).toBeDefined()
		expect(screen.getByTestId('role-option-ADMIN')).toBeDefined()
		expect(screen.getByTestId('role-option-MEMBER')).toBeDefined()
	})

	it('вызывает onEmailChange, onRoleChange и onClose', () => {
		let changedEmail = ''
		let changedRole = ''
		let closeCalls = 0

		render(
			<TeamInviteMemberDialog
				email=''
				isOpen
				isPending={false}
				isSubmitDisabled={false}
				onClose={() => {
					closeCalls += 1
				}}
				onEmailChange={(value) => {
					changedEmail = value
				}}
				onOpenChange={() => undefined}
				onRoleChange={(value) => {
					changedRole = value
				}}
				onSubmit={() => undefined}
				role={TEAM_ROLES.MEMBER}
			/>,
		)

		fireEvent.change(screen.getByLabelText('Email'), {
			target: { value: 'invite@test.dev' },
		})
		fireEvent.click(screen.getByTestId('change-role'))
		fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))

		expect(changedEmail).toBe('invite@test.dev')
		expect(changedRole).toBe(TEAM_ROLES.ADMIN)
		expect(closeCalls).toBe(1)
	})

	it('submit вызывает onSubmit, а pending меняет текст кнопки', () => {
		let submitCalls = 0
		const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault()
			submitCalls += 1
		}
		const { rerender } = render(
			<TeamInviteMemberDialog
				email='invite@test.dev'
				isOpen
				isPending={false}
				isSubmitDisabled={false}
				onClose={() => undefined}
				onEmailChange={() => undefined}
				onOpenChange={() => undefined}
				onRoleChange={() => undefined}
				onSubmit={handleSubmit}
				role={TEAM_ROLES.MEMBER}
			/>,
		)

		const submitButton = screen.getByRole('button', { name: 'Отправить приглашение' })
		fireEvent.submit(submitButton.closest('form')!)

		expect(submitCalls).toBe(1)

		rerender(
			<TeamInviteMemberDialog
				email='invite@test.dev'
				isOpen
				isPending
				isSubmitDisabled={false}
				onClose={() => undefined}
				onEmailChange={() => undefined}
				onOpenChange={() => undefined}
				onRoleChange={() => undefined}
				onSubmit={handleSubmit}
				role={TEAM_ROLES.MEMBER}
			/>,
		)

		expect(screen.getByRole('button', { name: 'Отправка...' })).toBeDefined()
	})
})
