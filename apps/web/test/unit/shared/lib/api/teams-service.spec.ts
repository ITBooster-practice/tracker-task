import { AxiosHeaders, type AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { teamsService } from '@/shared/lib/api/teams-service'

// vi.hoisted — создаёт моки ДО hoisting vi.mock
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

// Хелпер: оборачивает data в AxiosResponse
function axiosResponse<T>(data: T): AxiosResponse<T> {
	return {
		data,
		status: 200,
		statusText: 'OK',
		headers: {},
		config: { headers: new AxiosHeaders() },
	}
}

describe('teamsService', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('getAll', () => {
		it('возвращает список команд', async () => {
			const teams = [{ id: '1', name: 'Team A' }]
			mockGet.mockResolvedValue(axiosResponse(teams))

			const result = await teamsService.getAll()

			expect(mockGet).toHaveBeenCalledWith('/teams')
			expect(result).toEqual(teams)
		})
	})

	describe('getById — нормализация members', () => {
		it('member с плоскими полями', async () => {
			mockGet.mockResolvedValue(
				axiosResponse({
					id: 't1',
					name: 'Team',
					members: [
						{
							id: 'm1',
							userId: 'u1',
							name: 'Alex',
							email: 'alex@test.com',
							role: 'ADMIN',
							joinedAt: '2024-01-01',
						},
					],
				}),
			)

			const result = await teamsService.getById('t1')

			expect(result.members[0]).toEqual({
				id: 'm1',
				userId: 'u1',
				name: 'Alex',
				email: 'alex@test.com',
				role: 'ADMIN',
				joinedAt: '2024-01-01',
			})
		})

		it('member с вложенным user → берёт данные из user', async () => {
			mockGet.mockResolvedValue(
				axiosResponse({
					id: 't1',
					name: 'Team',
					members: [{ user: { id: 'u2', name: 'Bob', email: 'bob@test.com' } }],
				}),
			)

			const result = await teamsService.getById('t1')

			expect(result.members[0]).toEqual({
				id: 'u2',
				userId: 'u2',
				name: 'Bob',
				email: 'bob@test.com',
				role: 'MEMBER',
				joinedAt: '',
			})
		})

		it('пустые поля → дефолтные значения', async () => {
			mockGet.mockResolvedValue(
				axiosResponse({
					id: 't1',
					name: 'Team',
					members: [{}],
				}),
			)

			const result = await teamsService.getById('t1')

			expect(result.members[0]).toEqual({
				id: '',
				userId: '',
				name: null,
				email: '',
				role: 'MEMBER',
				joinedAt: '',
			})
		})

		it('members не массив → пустой массив', async () => {
			mockGet.mockResolvedValue(
				axiosResponse({
					id: 't1',
					name: 'Team',
					members: null,
				}),
			)

			const result = await teamsService.getById('t1')

			expect(result.members).toEqual([])
		})
	})

	describe('create', () => {
		it('POST на /teams/new + нормализует ответ', async () => {
			mockPost.mockResolvedValue(
				axiosResponse({
					id: 't1',
					name: 'New Team',
					members: [{ user: { id: 'u1', name: 'Creator', email: 'c@test.com' } }],
				}),
			)

			const result = await teamsService.create({ name: 'New Team' })

			expect(mockPost).toHaveBeenCalledWith('/teams/new', { name: 'New Team' })
			expect(result.members[0]!.userId).toBe('u1')
		})
	})

	describe('update', () => {
		it('PATCH на /teams/:id', async () => {
			mockPatch.mockResolvedValue(
				axiosResponse({ id: 't1', name: 'Updated', members: [] }),
			)

			const result = await teamsService.update('t1', { name: 'Updated' })

			expect(mockPatch).toHaveBeenCalledWith('/teams/t1', { name: 'Updated' })
			expect(result.name).toBe('Updated')
		})
	})

	describe('delete', () => {
		it('DELETE на /teams/:id', async () => {
			mockDelete.mockResolvedValue(axiosResponse({ success: true }))

			const result = await teamsService.delete('t1')

			expect(mockDelete).toHaveBeenCalledWith('/teams/t1')
			expect(result).toEqual({ success: true })
		})
	})
})
