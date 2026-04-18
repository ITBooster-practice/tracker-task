import '@/test/mocks/api/http-client.mock'

import { mockApiClient, resetApiClientMock } from '@/test/mocks/api/http-client.mock'
import {
	axiosResponse,
	createDeleteTeamResponseFixture,
	createNestedTeamMemberApiFixture,
	createTeamApiFixture,
	createTeamListItemFixture,
	createTeamMemberFixture,
} from '@/test/mocks/api/team-api.fixtures'
import { beforeEach, describe, expect, it } from 'vitest'

import { teamsService } from '@/shared/lib/api/teams-service'

describe('teamsService', () => {
	beforeEach(() => {
		resetApiClientMock()
	})

	it('getAll возвращает список команд без дополнительных преобразований', async () => {
		mockApiClient.get.mockResolvedValue(
			axiosResponse({
				data: [createTeamListItemFixture({ name: 'Team', currentUserRole: 'OWNER' })],
				meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
			}),
		)

		const result = await teamsService.getAll()

		expect(mockApiClient.get).toHaveBeenCalledWith('/teams', { params: undefined })
		expect(result.data).toEqual([
			createTeamListItemFixture({
				name: 'Team',
				currentUserRole: 'OWNER',
			}),
		])
	})

	it('getById маппит nested members в плоский формат', async () => {
		mockApiClient.get.mockResolvedValue(
			axiosResponse(
				createTeamApiFixture({
					name: 'Team',
					members: [createNestedTeamMemberApiFixture({ joinedAt: undefined })],
				}),
			),
		)

		const result = await teamsService.getById('team-1')

		expect(result.members).toEqual([
			createTeamMemberFixture({
				id: 'member-1',
				userId: 'user-1',
				name: 'Alex',
				email: 'alex@test.com',
				role: 'ADMIN',
				joinedAt: '',
			}),
		])
	})

	it('getById сохраняет уже плоских участников без потерь', async () => {
		mockApiClient.get.mockResolvedValue(
			axiosResponse(
				createTeamApiFixture({
					name: 'Team',
					members: [
						createTeamMemberFixture({
							id: 'member-1',
							userId: 'user-1',
							name: 'Alex',
							email: 'alex@test.com',
							role: 'MEMBER',
							joinedAt: '2024-02-01',
						}),
					],
				}),
			),
		)

		const result = await teamsService.getById('team-1')

		expect(mockApiClient.get).toHaveBeenCalledWith('/teams/team-1')
		expect(result.members).toEqual([
			createTeamMemberFixture({
				id: 'member-1',
				userId: 'user-1',
				name: 'Alex',
				email: 'alex@test.com',
				role: 'MEMBER',
				joinedAt: '2024-02-01',
			}),
		])
	})

	it('getById возвращает пустой массив участников как есть', async () => {
		mockApiClient.get.mockResolvedValue(
			axiosResponse(
				createTeamApiFixture({
					name: 'Team',
					members: [],
				}),
			),
		)

		const result = await teamsService.getById('team-1')

		expect(result.members).toEqual([])
	})

	it('create отправляет запрос на создание и нормализует ответ', async () => {
		mockApiClient.post.mockResolvedValue(
			axiosResponse(
				createTeamApiFixture({
					name: 'Team',
					members: [
						createNestedTeamMemberApiFixture({ role: 'OWNER', joinedAt: undefined }),
					],
				}),
			),
		)

		const result = await teamsService.create({
			name: 'Dream Team',
		})

		expect(mockApiClient.post).toHaveBeenCalledWith('/teams/new', {
			name: 'Dream Team',
		})
		expect(result.members[0]).toEqual({
			id: 'member-1',
			userId: 'user-1',
			name: 'Alex',
			email: 'alex@test.com',
			role: 'OWNER',
			joinedAt: '',
		})
	})

	it('update вызывает endpoint команды и нормализует ответ', async () => {
		mockApiClient.patch.mockResolvedValue(
			axiosResponse(
				createTeamApiFixture({
					name: 'Updated Team',
					description: 'Refined description',
					members: [],
				}),
			),
		)

		const result = await teamsService.update('team-1', {
			name: 'Updated Team',
			description: 'Refined description',
		})

		expect(mockApiClient.patch).toHaveBeenCalledWith('/teams/team-1', {
			name: 'Updated Team',
			description: 'Refined description',
		})
		expect(result.name).toBe('Updated Team')
		expect(result.members).toEqual([])
	})

	it('delete возвращает серверный ответ без изменений', async () => {
		mockApiClient.delete.mockResolvedValue(
			axiosResponse(createDeleteTeamResponseFixture()),
		)

		const result = await teamsService.delete('team-1')

		expect(mockApiClient.delete).toHaveBeenCalledWith('/teams/team-1')
		expect(result).toEqual(createDeleteTeamResponseFixture())
	})
})
