import { AxiosHeaders, type AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { teamsService } from '@/shared/lib/api/teams-service'

const { mockGet, mockPost, mockPatch, mockDelete } = vi.hoisted(() => ({
	mockGet: vi.fn(),
	mockPost: vi.fn(),
	mockPatch: vi.fn(),
	mockDelete: vi.fn(),
}))

vi.mock('@/shared/lib/api/client', () => ({
	client: {
		get: mockGet,
		post: mockPost,
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

const baseTeam = {
	id: 'team-1',
	name: 'Team',
	description: null,
	avatarUrl: null,
	createdAt: '2024-01-01',
	updatedAt: '2024-01-01',
}

describe('teamsService members normalization', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('данные приходят как { user, role } и маппятся в плоский member', async () => {
		mockGet.mockResolvedValue(
			axiosResponse({
				...baseTeam,
				members: [
					{
						user: {
							id: 'user-1',
							name: 'Alex',
							email: 'alex@test.com',
						},
						role: 'ADMIN',
					},
				],
			}),
		)

		const result = await teamsService.getById('team-1')

		expect(result.members).toEqual([
			{
				id: 'user-1',
				userId: 'user-1',
				name: 'Alex',
				email: 'alex@test.com',
				role: 'ADMIN',
				joinedAt: '',
			},
		])
	})

	it('данные уже плоские и маппятся без потерь', async () => {
		mockGet.mockResolvedValue(
			axiosResponse({
				...baseTeam,
				members: [
					{
						id: 'member-1',
						userId: 'user-1',
						name: 'Alex',
						email: 'alex@test.com',
						role: 'MEMBER',
						joinedAt: '2024-02-01',
					},
				],
			}),
		)

		const result = await teamsService.getById('team-1')

		expect(result.members).toEqual([
			{
				id: 'member-1',
				userId: 'user-1',
				name: 'Alex',
				email: 'alex@test.com',
				role: 'MEMBER',
				joinedAt: '2024-02-01',
			},
		])
	})

	it('пустой массив members возвращается как пустой массив', async () => {
		mockGet.mockResolvedValue(
			axiosResponse({
				...baseTeam,
				members: [],
			}),
		)

		const result = await teamsService.getById('team-1')

		expect(result.members).toEqual([])
	})
})
