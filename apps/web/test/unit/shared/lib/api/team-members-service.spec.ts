import { AxiosHeaders, type AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { teamMembersService } from '@/shared/lib/api/team-members-service'

const { mockGet, mockPatch, mockDelete } = vi.hoisted(() => ({
	mockGet: vi.fn(),
	mockPatch: vi.fn(),
	mockDelete: vi.fn(),
}))

vi.mock('@/shared/lib/api/client', () => ({
	client: {
		get: mockGet,
		patch: mockPatch,
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

describe('teamMembersService', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('getMembers нормализует nested user в плоский TeamMember', async () => {
		mockGet.mockResolvedValue(
			axiosResponse([
				{
					id: 'member-1',
					teamId: 'team-1',
					userId: 'user-1',
					user: {
						id: 'user-1',
						name: 'Alex',
						email: 'alex@test.com',
					},
					role: 'ADMIN',
					joinedAt: '2024-02-01',
				},
			]),
		)

		const result = await teamMembersService.getMembers('team-1')

		expect(mockGet).toHaveBeenCalledWith('/teams/team-1/members')
		expect(result).toEqual([
			{
				id: 'member-1',
				userId: 'user-1',
				name: 'Alex',
				email: 'alex@test.com',
				role: 'ADMIN',
				joinedAt: '2024-02-01',
			},
		])
	})

	it('changeRole вызывает правильный endpoint и возвращает member', async () => {
		mockPatch.mockResolvedValue(
			axiosResponse({
				id: 'member-1',
				userId: 'user-1',
				name: 'Alex',
				email: 'alex@test.com',
				role: 'MEMBER',
				joinedAt: '2024-02-01',
			}),
		)

		const result = await teamMembersService.changeRole('team-1', 'user-1', {
			role: 'MEMBER',
		})

		expect(mockPatch).toHaveBeenCalledWith('/teams/team-1/members/user-1/role', {
			role: 'MEMBER',
		})
		expect(result.role).toBe('MEMBER')
	})

	it('removeMember возвращает серверный ответ без изменений', async () => {
		mockDelete.mockResolvedValue(
			axiosResponse({
				message: 'Участник успешно исключён',
				success: true,
			}),
		)

		const result = await teamMembersService.removeMember('team-1', 'user-1')

		expect(mockDelete).toHaveBeenCalledWith('/teams/team-1/members/user-1')
		expect(result).toEqual({
			message: 'Участник успешно исключён',
			success: true,
		})
	})
})
