import {
	createTeamInvitationFixture,
	createTeamMemberFixture,
} from '@/test/mocks/api/team-api.fixtures'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TEAM_INVITATION_STATUSES, TEAM_ROLES } from '@repo/types'

import '@/test/mocks/views/teams/team-settings-sections.mock'

import { TeamSettingsDangerZoneSection } from '@/views/teams/ui/team-settings-danger-zone-section'
import { TeamSettingsInvitationsSection } from '@/views/teams/ui/team-settings-invitations-section'
import { TeamSettingsMembersSection } from '@/views/teams/ui/team-settings-members-section'
import { TeamSettingsRolesSection } from '@/views/teams/ui/team-settings-roles-section'
import { TeamSettingsSection } from '@/views/teams/ui/team-settings-section'

describe('team settings sections', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(cleanup)

	it('TeamSettingsSection рендерит title, description, action и children', () => {
		const noop = () => undefined

		render(
			<TeamSettingsSection
				title='Секция'
				description='Описание секции'
				icon={() => <span data-testid='section-icon' />}
				action={
					<button type='button' onClick={noop}>
						Action
					</button>
				}
			>
				<div>Контент секции</div>
			</TeamSettingsSection>,
		)

		expect(screen.getByText('Секция')).toBeDefined()
		expect(screen.getByText('Описание секции')).toBeDefined()
		expect(screen.getByRole('button', { name: 'Action' })).toBeDefined()
		expect(screen.getByText('Контент секции')).toBeDefined()
	})

	it('TeamSettingsRolesSection показывает все роли команды', () => {
		render(<TeamSettingsRolesSection />)

		expect(screen.getByText('Владелец')).toBeDefined()
		expect(screen.getByText('Администратор')).toBeDefined()
		expect(screen.getByText('Участник')).toBeDefined()
	})

	it('TeamSettingsDangerZoneSection вызывает onDeleteTeam и показывает pending-текст', () => {
		let deleteCalls = 0
		const { rerender } = render(
			<TeamSettingsDangerZoneSection
				isPending={false}
				onDeleteTeam={() => {
					deleteCalls += 1
				}}
			/>,
		)

		fireEvent.click(screen.getByRole('button', { name: 'Удалить команду' }))
		expect(deleteCalls).toBe(1)

		rerender(
			<TeamSettingsDangerZoneSection
				isPending
				onDeleteTeam={() => {
					deleteCalls += 1
				}}
			/>,
		)

		expect(screen.getByRole('button', { name: 'Удаление...' })).toBeDefined()
	})

	it('TeamSettingsInvitationsSection показывает loading и error состояния', () => {
		let retryCalls = 0
		const { rerender } = render(
			<TeamSettingsInvitationsSection
				invitations={[]}
				isError={false}
				isLoading
				onRetry={() => {
					retryCalls += 1
				}}
				onRevoke={() => undefined}
				pendingInvitationId={null}
			/>,
		)

		expect(screen.getByText('Загрузка приглашений...')).toBeDefined()

		rerender(
			<TeamSettingsInvitationsSection
				invitations={[]}
				isError
				isLoading={false}
				onRetry={() => {
					retryCalls += 1
				}}
				onRevoke={() => undefined}
				pendingInvitationId={null}
			/>,
		)

		fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
		expect(retryCalls).toBe(1)
	})

	it('TeamSettingsInvitationsSection рендерит только pending invitations и отзывает выбранное', () => {
		let revokedInvitationId = ''
		const pendingInvitation = createTeamInvitationFixture({
			id: 'inv-pending',
			email: 'pending@test.dev',
		})
		const acceptedInvitation = createTeamInvitationFixture({
			id: 'inv-accepted',
			email: 'accepted@test.dev',
			status: TEAM_INVITATION_STATUSES.ACCEPTED,
		})

		render(
			<TeamSettingsInvitationsSection
				invitations={[pendingInvitation, acceptedInvitation]}
				isError={false}
				isLoading={false}
				onRetry={() => undefined}
				onRevoke={(invitation) => {
					revokedInvitationId = invitation.id
				}}
				pendingInvitationId={null}
			/>,
		)

		expect(screen.getByText('Приглашения (1)')).toBeDefined()
		expect(screen.getByText('pending@test.dev')).toBeDefined()
		expect(screen.queryByText('accepted@test.dev')).toBeNull()

		fireEvent.click(screen.getByRole('button', { name: 'Отозвать' }))
		expect(revokedInvitationId).toBe(pendingInvitation.id)
	})

	it('TeamSettingsMembersSection показывает loading и error состояния c retry', () => {
		let retryCalls = 0
		const { rerender } = render(
			<TeamSettingsMembersSection
				currentUserId='owner-1'
				currentUserRole={TEAM_ROLES.OWNER}
				isError={false}
				isLoading
				isMutatingRoleForUserId={null}
				members={[]}
				onOpenRemoveDialog={() => undefined}
				onRoleChange={() => undefined}
				onRetry={() => {
					retryCalls += 1
				}}
			/>,
		)

		expect(screen.getByText('Загрузка участников...')).toBeDefined()

		rerender(
			<TeamSettingsMembersSection
				currentUserId='owner-1'
				currentUserRole={TEAM_ROLES.OWNER}
				isError
				isLoading={false}
				isMutatingRoleForUserId={null}
				members={[]}
				onOpenRemoveDialog={() => undefined}
				onRoleChange={() => undefined}
				onRetry={() => {
					retryCalls += 1
				}}
			/>,
		)

		fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
		expect(retryCalls).toBe(1)
	})

	it('TeamSettingsMembersSection для owner показывает управление участником', () => {
		let removedMemberId = ''
		let changedMemberRole = ''
		const member = createTeamMemberFixture({
			id: 'member-2',
			userId: 'user-2',
			name: 'Alice Member',
			email: 'alice@example.com',
			role: TEAM_ROLES.MEMBER,
		})

		render(
			<TeamSettingsMembersSection
				currentUserId='owner-1'
				currentUserRole={TEAM_ROLES.OWNER}
				isError={false}
				isLoading={false}
				isMutatingRoleForUserId={null}
				members={[member]}
				onOpenRemoveDialog={(value) => {
					removedMemberId = value.id
				}}
				onRoleChange={(_, nextRole) => {
					changedMemberRole = nextRole
				}}
				onRetry={() => undefined}
			/>,
		)

		expect(screen.getByText('Alice Member')).toBeDefined()
		expect(screen.getByText('alice@example.com')).toBeDefined()
		expect(screen.getByText('Выберите роль')).toBeDefined()

		fireEvent.click(screen.getByTestId('change-role'))
		expect(changedMemberRole).toBe(TEAM_ROLES.ADMIN)

		fireEvent.click(screen.getByRole('button', { name: 'Удалить Alice Member' }))
		expect(removedMemberId).toBe(member.id)
	})
})
