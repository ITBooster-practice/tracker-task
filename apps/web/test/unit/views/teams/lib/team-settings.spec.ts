import {
	createTeamInvitationFixture,
	createTeamMemberFixture,
} from '@/test/mocks/api/team-api.fixtures'
import { describe, expect, it } from 'vitest'

import { TEAM_INVITATION_STATUSES, TEAM_ROLES } from '@repo/types'

import {
	canChangeMemberRole,
	canDeleteTeam,
	canRemoveMember,
	getCurrentTeamMember,
	getDeleteMemberDescription,
	getDeleteMemberDialogCopy,
	getInvitationMeta,
	getPendingTeamInvitations,
	getTeamRoleBadgeClassName,
	getTeamRoleLabel,
	isTeamManagerRole,
} from '@/views/teams/lib/team-settings'

describe('team settings helpers', () => {
	it('canChangeMemberRole: owner/admin могут менять роль не-owner участнику, но не себе', () => {
		const member = createTeamMemberFixture({
			userId: 'member-1',
			role: TEAM_ROLES.MEMBER,
		})

		expect(canChangeMemberRole('owner-1', TEAM_ROLES.OWNER, member)).toBe(true)
		expect(canChangeMemberRole('admin-1', TEAM_ROLES.ADMIN, member)).toBe(true)
		expect(
			canChangeMemberRole(
				'admin-1',
				TEAM_ROLES.ADMIN,
				createTeamMemberFixture({
					userId: 'admin-1',
					role: TEAM_ROLES.ADMIN,
				}),
			),
		).toBe(false)
		expect(
			canChangeMemberRole(
				'owner-1',
				TEAM_ROLES.OWNER,
				createTeamMemberFixture({
					userId: 'owner-2',
					role: TEAM_ROLES.OWNER,
				}),
			),
		).toBe(false)
	})

	it('canRemoveMember учитывает роль текущего пользователя и цель удаления', () => {
		const member = createTeamMemberFixture({
			userId: 'member-1',
			role: TEAM_ROLES.MEMBER,
		})
		const admin = createTeamMemberFixture({
			userId: 'admin-2',
			role: TEAM_ROLES.ADMIN,
		})

		expect(canRemoveMember(undefined, TEAM_ROLES.OWNER, member)).toBe(false)
		expect(canRemoveMember('owner-1', TEAM_ROLES.OWNER, member)).toBe(true)
		expect(canRemoveMember('admin-1', TEAM_ROLES.ADMIN, member)).toBe(true)
		expect(canRemoveMember('admin-1', TEAM_ROLES.ADMIN, admin)).toBe(false)
		expect(
			canRemoveMember(
				'admin-1',
				TEAM_ROLES.ADMIN,
				createTeamMemberFixture({
					userId: 'admin-1',
					role: TEAM_ROLES.ADMIN,
				}),
			),
		).toBe(true)
	})

	it('getCurrentTeamMember находит текущего участника или возвращает null', () => {
		const members = [
			createTeamMemberFixture({ userId: 'user-1', email: 'one@test.dev' }),
			createTeamMemberFixture({ userId: 'user-2', email: 'two@test.dev' }),
		]

		expect(getCurrentTeamMember(members, 'user-2')?.email).toBe('two@test.dev')
		expect(getCurrentTeamMember(members, 'missing-user')).toBeNull()
	})

	it('isTeamManagerRole и canDeleteTeam корректно различают owner/admin/member', () => {
		expect(isTeamManagerRole(TEAM_ROLES.OWNER)).toBe(true)
		expect(isTeamManagerRole(TEAM_ROLES.ADMIN)).toBe(true)
		expect(isTeamManagerRole(TEAM_ROLES.MEMBER)).toBe(false)

		expect(canDeleteTeam(TEAM_ROLES.OWNER)).toBe(true)
		expect(canDeleteTeam(TEAM_ROLES.ADMIN)).toBe(false)
		expect(canDeleteTeam(undefined)).toBe(false)
	})

	it('getPendingTeamInvitations оставляет только pending-приглашения', () => {
		const invitations = [
			createTeamInvitationFixture({
				id: 'inv-pending',
				status: TEAM_INVITATION_STATUSES.PENDING,
			}),
			createTeamInvitationFixture({
				id: 'inv-accepted',
				status: TEAM_INVITATION_STATUSES.ACCEPTED,
			}),
		]

		expect(
			getPendingTeamInvitations(invitations).map((invitation) => invitation.id),
		).toEqual(['inv-pending'])
	})

	it('getInvitationMeta и getTeamRoleLabel возвращают человекочитаемый текст', () => {
		const invitation = createTeamInvitationFixture({
			role: TEAM_ROLES.MEMBER,
			expiresAt: '2026-04-11T12:00:00.000Z',
		})

		expect(getTeamRoleLabel(TEAM_ROLES.ADMIN)).toBe('Администратор')
		expect(getInvitationMeta(invitation)).toContain('Участник')
		expect(getInvitationMeta(invitation)).toContain('до')
	})

	it('getTeamRoleBadgeClassName и getDeleteMemberDialogCopy возвращают нужный конфиг', () => {
		expect(getTeamRoleBadgeClassName(TEAM_ROLES.OWNER)).toContain('amber')
		expect(getTeamRoleBadgeClassName(TEAM_ROLES.ADMIN)).toContain('sky')
		expect(getDeleteMemberDialogCopy(false).confirm).toBe('Удалить')
		expect(getDeleteMemberDialogCopy(true).confirm).toBe('Покинуть')
	})

	it('getDeleteMemberDescription использует разный copy для self-action и обычного удаления', () => {
		const member = createTeamMemberFixture({
			name: 'Alice Member',
			email: 'alice@example.com',
		})

		expect(getDeleteMemberDescription(member, false)).toContain(
			'Alice Member больше не сможет работать в этой команде.',
		)
		expect(getDeleteMemberDescription(member, true)).toContain(
			'Alice Member потеряет доступ к команде сразу после подтверждения.',
		)
	})
})
