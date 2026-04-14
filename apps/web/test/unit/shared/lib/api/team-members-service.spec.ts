import '@/test/mocks/api/http-client.mock'

import { mockApiClient, resetApiClientMock } from '@/test/mocks/api/http-client.mock'
import {
	axiosResponse,
	createDeleteTeamResponseFixture,
	createNestedTeamMemberApiFixture,
	createTeamMemberFixture,
} from '@/test/mocks/api/team-api.fixtures'
import { beforeEach, describe, expect, it } from 'vitest'

import { teamMembersService } from '@/shared/lib/api/team-members-service'

describe('teamMembersService', () => {
	beforeEach(() => {
		resetApiClientMock()
	})

	it('getMembers нормализует nested user в плоский TeamMember', async () => {
		mockApiClient.get.mockResolvedValue(
			axiosResponse([createNestedTeamMemberApiFixture()]),
		)

		const result = await teamMembersService.getMembers('team-1')

		expect(mockApiClient.get).toHaveBeenCalledWith('/teams/team-1/members')
		expect(result).toEqual([
			createTeamMemberFixture({
				id: 'member-1',
				userId: 'user-1',
				name: 'Alex',
				email: 'alex@test.com',
				role: 'ADMIN',
				joinedAt: '2024-02-01',
			}),
		])
	})

	it('changeRole вызывает правильный endpoint и возвращает member', async () => {
		mockApiClient.patch.mockResolvedValue(
			axiosResponse(
				createTeamMemberFixture({
					id: 'member-1',
					userId: 'user-1',
					name: 'Alex',
					email: 'alex@test.com',
					role: 'MEMBER',
					joinedAt: '2024-02-01',
				}),
			),
		)

		const result = await teamMembersService.changeRole('team-1', 'user-1', {
			role: 'MEMBER',
		})

		expect(mockApiClient.patch).toHaveBeenCalledWith(
			'/teams/team-1/members/user-1/role',
			{
				role: 'MEMBER',
			},
		)
		expect(result.role).toBe('MEMBER')
	})

	it('removeMember возвращает серверный ответ без изменений', async () => {
		mockApiClient.delete.mockResolvedValue(
			axiosResponse(
				createDeleteTeamResponseFixture({
					message: 'Участник успешно исключён',
				}),
			),
		)

		const result = await teamMembersService.removeMember('team-1', 'user-1')

		expect(mockApiClient.delete).toHaveBeenCalledWith('/teams/team-1/members/user-1')
		expect(result).toEqual(
			createDeleteTeamResponseFixture({
				message: 'Участник успешно исключён',
			}),
		)
	})
})
