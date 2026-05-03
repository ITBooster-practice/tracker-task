import '@/test/mocks/api/http-client.mock'

import { mockApiClient, resetApiClientMock } from '@/test/mocks/api/http-client.mock'
import {
	axiosResponse,
	createMyInvitationApiFixture,
	createMyInvitationFixture,
	createNestedTeamMemberApiFixture,
	createTeamApiFixture,
	createTeamInvitationApiFixture,
} from '@/test/mocks/api/team-api.fixtures'
import { beforeEach, describe, expect, it } from 'vitest'

import { teamInvitationsService } from '@/shared/lib/api/team-invitations-service'

describe('teamInvitationsService', () => {
	beforeEach(() => {
		resetApiClientMock()
	})

	it('sendInvitation отправляет запрос и нормализует invitation response', async () => {
		mockApiClient.post.mockResolvedValue(
			axiosResponse(
				createTeamInvitationApiFixture({
					role: 'ADMIN',
				}),
			),
		)

		const result = await teamInvitationsService.sendInvitation('team-1', {
			email: 'new@test.com',
			role: 'ADMIN',
		})

		expect(mockApiClient.post).toHaveBeenCalledWith('/teams/team-1/invitations', {
			email: 'new@test.com',
			role: 'ADMIN',
		})
		expect(result.team.name).toBe('Dream Team')
		expect(result.invitedBy.email).toBe('alex@test.com')
	})

	it('getTeamInvitations загружает список приглашений команды и нормализует его', async () => {
		mockApiClient.get.mockResolvedValue(
			axiosResponse({
				data: [createTeamInvitationApiFixture({ role: 'ADMIN' })],
				meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
			}),
		)

		const result = await teamInvitationsService.getTeamInvitations('team-1')

		expect(mockApiClient.get).toHaveBeenCalledWith('/teams/team-1/invitations', {
			params: undefined,
		})
		expect(result.data).toHaveLength(1)
		expect(result.data[0]).toMatchObject({
			id: 'inv-1',
			status: 'PENDING',
			team: { id: 'team-1', name: 'Dream Team', avatarUrl: null },
		})
	})

	it('getMyInvitations нормализует список входящих invitations', async () => {
		mockApiClient.get.mockResolvedValue(
			axiosResponse({ data: [createMyInvitationApiFixture()], meta: {} }),
		)

		const result = await teamInvitationsService.getMyInvitations()

		expect(mockApiClient.get).toHaveBeenCalledWith('/invitations/me')
		expect(result).toEqual([createMyInvitationFixture()])
	})

	it('acceptInvitation возвращает нормализованную team', async () => {
		mockApiClient.post.mockResolvedValue(
			axiosResponse(
				createTeamApiFixture({
					name: 'Dream Team',
					updatedAt: '2024-01-02',
					members: [
						createNestedTeamMemberApiFixture({ role: 'OWNER', joinedAt: undefined }),
					],
				}),
			),
		)

		const result = await teamInvitationsService.acceptInvitation('token-1')

		expect(mockApiClient.post).toHaveBeenCalledWith('/invitations/token-1/accept')
		expect(result.members[0]).toEqual({
			id: 'member-1',
			userId: 'user-1',
			name: 'Alex',
			email: 'alex@test.com',
			role: 'OWNER',
			joinedAt: '',
		})
	})

	it('declineInvitation вызывает decline endpoint и возвращает invitation', async () => {
		mockApiClient.post.mockResolvedValue(
			axiosResponse(
				createTeamInvitationApiFixture({
					status: 'DECLINED',
					updatedAt: '2026-04-09T12:05:00.000Z',
				}),
			),
		)

		const result = await teamInvitationsService.declineInvitation('token-1')

		expect(mockApiClient.post).toHaveBeenCalledWith('/invitations/token-1/decline')
		expect(result.status).toBe('DECLINED')
		expect(result.team.name).toBe('Dream Team')
	})

	it('revokeInvitation вызывает delete endpoint и возвращает invitation', async () => {
		mockApiClient.delete.mockResolvedValue(
			axiosResponse(
				createTeamInvitationApiFixture({
					status: 'DECLINED',
					updatedAt: '2026-04-09T12:05:00.000Z',
				}),
			),
		)

		const result = await teamInvitationsService.revokeInvitation('team-1', 'inv-1')

		expect(mockApiClient.delete).toHaveBeenCalledWith('/teams/team-1/invitations/inv-1')
		expect(result.status).toBe('DECLINED')
	})
})
