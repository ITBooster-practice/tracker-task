import {
	createMyInvitationApiFixture,
	createNestedTeamMemberApiFixture,
	createTeamApiFixture,
	createTeamInvitationApiFixture,
	createTeamMemberFixture,
} from '@/test/mocks/api/team-api.fixtures'
import { describe, expect, it } from 'vitest'

import { TEAM_INVITATION_STATUSES, TEAM_ROLES } from '@repo/types'

import {
	normalizeMyInvitation,
	normalizeTeam,
	normalizeTeamInvitation,
	normalizeTeamMember,
} from '@/shared/lib/api/teams-normalizers'

describe('teams-normalizers', () => {
	describe('normalizeTeamMember', () => {
		it('возвращает плоского участника без потерь', () => {
			const member = createTeamMemberFixture({
				id: 'member-1',
				userId: 'user-1',
				name: 'Alex',
				email: 'alex@test.com',
				role: TEAM_ROLES.MEMBER,
				joinedAt: '2024-02-01',
			})

			expect(normalizeTeamMember(member)).toEqual(member)
		})

		it('маппит nested user и подставляет fallback для id и joinedAt', () => {
			const member = createNestedTeamMemberApiFixture({
				id: undefined,
				userId: undefined,
				joinedAt: undefined,
				user: {
					id: 'user-42',
					name: 'Casey',
					email: 'casey@test.com',
				},
			})

			expect(normalizeTeamMember(member)).toEqual({
				id: 'user-42',
				userId: 'user-42',
				name: 'Casey',
				email: 'casey@test.com',
				role: TEAM_ROLES.ADMIN,
				joinedAt: '',
			})
		})
	})

	describe('normalizeTeam', () => {
		it('нормализует mixed members list', () => {
			const team = createTeamApiFixture({
				members: [
					createNestedTeamMemberApiFixture({
						id: undefined,
						userId: undefined,
						joinedAt: undefined,
					}),
					createTeamMemberFixture({
						id: 'member-2',
						userId: 'user-2',
						name: 'Jamie',
						email: 'jamie@test.com',
						role: TEAM_ROLES.MEMBER,
						joinedAt: '2024-03-01',
					}),
				],
			})

			expect(normalizeTeam(team).members).toEqual([
				{
					id: 'user-1',
					userId: 'user-1',
					name: 'Alex',
					email: 'alex@test.com',
					role: TEAM_ROLES.ADMIN,
					joinedAt: '',
				},
				{
					id: 'member-2',
					userId: 'user-2',
					name: 'Jamie',
					email: 'jamie@test.com',
					role: TEAM_ROLES.MEMBER,
					joinedAt: '2024-03-01',
				},
			])
		})
	})

	describe('normalizeTeamInvitation', () => {
		it('сохраняет валидный invitation response', () => {
			const invitation = createTeamInvitationApiFixture({
				role: TEAM_ROLES.ADMIN,
				status: TEAM_INVITATION_STATUSES.PENDING,
			})

			expect(normalizeTeamInvitation(invitation)).toEqual({
				...invitation,
				invitedBy: {
					id: 'user-1',
					name: 'Alex',
					email: 'alex@test.com',
				},
				team: {
					id: 'team-1',
					name: 'Dream Team',
					avatarUrl: null,
				},
			})
		})

		it('подставляет дефолты для пустого invitation response', () => {
			expect(
				normalizeTeamInvitation({
					invitedBy: null,
					team: null,
				}),
			).toEqual({
				id: '',
				teamId: '',
				invitedById: '',
				email: '',
				role: TEAM_ROLES.MEMBER,
				status: TEAM_INVITATION_STATUSES.PENDING,
				token: '',
				expiresAt: '',
				createdAt: '',
				updatedAt: '',
				invitedBy: {
					id: '',
					name: null,
					email: '',
				},
				team: {
					id: '',
					name: '',
					avatarUrl: null,
				},
			})
		})
	})

	describe('normalizeMyInvitation', () => {
		it('сохраняет валидный my invitation response', () => {
			const invitation = createMyInvitationApiFixture({
				role: TEAM_ROLES.ADMIN,
			})

			expect(normalizeMyInvitation(invitation)).toEqual({
				...invitation,
				invitedBy: {
					id: 'user-1',
					name: 'Alex',
					email: 'alex@test.com',
				},
				team: {
					id: 'team-1',
					name: 'Dream Team',
					avatarUrl: null,
				},
			})
		})

		it('подставляет дефолты для пустого my invitation response', () => {
			expect(
				normalizeMyInvitation({
					invitedBy: null,
					team: null,
				}),
			).toEqual({
				id: '',
				email: '',
				role: TEAM_ROLES.MEMBER,
				token: '',
				expiresAt: '',
				createdAt: '',
				team: {
					id: '',
					name: '',
					avatarUrl: null,
				},
				invitedBy: {
					id: '',
					name: null,
					email: '',
				},
			})
		})
	})
})
