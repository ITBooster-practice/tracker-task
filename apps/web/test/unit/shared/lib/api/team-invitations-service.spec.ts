import { AxiosHeaders, type AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { teamInvitationsService } from '@/shared/lib/api/team-invitations-service'

const { mockGet, mockPost, mockDelete } = vi.hoisted(() => ({
	mockGet: vi.fn(),
	mockPost: vi.fn(),
	mockDelete: vi.fn(),
}))

vi.mock('@/shared/lib/api/client', () => ({
	client: {
		get: mockGet,
		post: mockPost,
		delete: mockDelete,
	},
}))

function axiosResponse<T>(data: T): AxiosResponse<T> {
	return {
		data,
		status: 200,
		statusText: 'OK',
		headers: {},
		config: { headers: new AxiosHeaders() },
	}
}

describe('teamInvitationsService', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('sendInvitation отправляет запрос и нормализует invitation response', async () => {
		mockPost.mockResolvedValue(
			axiosResponse({
				id: 'inv-1',
				teamId: 'team-1',
				invitedById: 'user-1',
				email: 'new@test.com',
				role: 'ADMIN',
				status: 'PENDING',
				token: 'token-1',
				expiresAt: '2026-04-11T12:00:00.000Z',
				createdAt: '2026-04-09T12:00:00.000Z',
				updatedAt: '2026-04-09T12:00:00.000Z',
				team: {
					id: 'team-1',
					name: 'Dream Team',
					avatarUrl: null,
				},
				invitedBy: {
					id: 'user-1',
					name: 'Alex',
					email: 'alex@test.com',
				},
			}),
		)

		const result = await teamInvitationsService.sendInvitation('team-1', {
			email: 'new@test.com',
			role: 'ADMIN',
		})

		expect(mockPost).toHaveBeenCalledWith('/teams/team-1/invitations', {
			email: 'new@test.com',
			role: 'ADMIN',
		})
		expect(result.team.name).toBe('Dream Team')
		expect(result.invitedBy.email).toBe('alex@test.com')
	})

	it('getMyInvitations нормализует список входящих invitations', async () => {
		mockGet.mockResolvedValue(
			axiosResponse([
				{
					id: 'inv-1',
					email: 'new@test.com',
					role: 'MEMBER',
					token: 'token-1',
					expiresAt: '2026-04-11T12:00:00.000Z',
					createdAt: '2026-04-09T12:00:00.000Z',
					team: {
						id: 'team-1',
						name: 'Dream Team',
						avatarUrl: null,
					},
					invitedBy: {
						id: 'user-1',
						name: 'Alex',
						email: 'alex@test.com',
					},
				},
			]),
		)

		const result = await teamInvitationsService.getMyInvitations()

		expect(mockGet).toHaveBeenCalledWith('/invitations/me')
		expect(result).toEqual([
			{
				id: 'inv-1',
				email: 'new@test.com',
				role: 'MEMBER',
				token: 'token-1',
				expiresAt: '2026-04-11T12:00:00.000Z',
				createdAt: '2026-04-09T12:00:00.000Z',
				team: {
					id: 'team-1',
					name: 'Dream Team',
					avatarUrl: null,
				},
				invitedBy: {
					id: 'user-1',
					name: 'Alex',
					email: 'alex@test.com',
				},
			},
		])
	})

	it('acceptInvitation возвращает нормализованную team', async () => {
		mockPost.mockResolvedValue(
			axiosResponse({
				id: 'team-1',
				name: 'Dream Team',
				description: null,
				avatarUrl: null,
				createdAt: '2024-01-01',
				updatedAt: '2024-01-02',
				members: [
					{
						user: {
							id: 'user-1',
							name: 'Alex',
							email: 'alex@test.com',
						},
						role: 'OWNER',
					},
				],
			}),
		)

		const result = await teamInvitationsService.acceptInvitation('token-1')

		expect(mockPost).toHaveBeenCalledWith('/invitations/token-1/accept')
		expect(result.members[0]).toEqual({
			id: 'user-1',
			userId: 'user-1',
			name: 'Alex',
			email: 'alex@test.com',
			role: 'OWNER',
			joinedAt: '',
		})
	})

	it('revokeInvitation вызывает delete endpoint и возвращает invitation', async () => {
		mockDelete.mockResolvedValue(
			axiosResponse({
				id: 'inv-1',
				teamId: 'team-1',
				invitedById: 'user-1',
				email: 'new@test.com',
				role: 'MEMBER',
				status: 'DECLINED',
				token: 'token-1',
				expiresAt: '2026-04-11T12:00:00.000Z',
				createdAt: '2026-04-09T12:00:00.000Z',
				updatedAt: '2026-04-09T12:05:00.000Z',
				team: {
					id: 'team-1',
					name: 'Dream Team',
					avatarUrl: null,
				},
				invitedBy: {
					id: 'user-1',
					name: 'Alex',
					email: 'alex@test.com',
				},
			}),
		)

		const result = await teamInvitationsService.revokeInvitation('team-1', 'inv-1')

		expect(mockDelete).toHaveBeenCalledWith('/teams/team-1/invitations/inv-1')
		expect(result.status).toBe('DECLINED')
	})
})
