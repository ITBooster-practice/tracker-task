import { AxiosHeaders, type AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authService } from '@/shared/lib/api/auth-service'

const { mockGet, mockPost } = vi.hoisted(() => ({
	mockGet: vi.fn(),
	mockPost: vi.fn(),
}))

vi.mock('@/shared/lib/api/client', () => ({
	client: { get: mockGet },
}))

vi.mock('@/shared/lib/api/public-client', () => ({
	publicClient: { post: mockPost },
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

describe('authService', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('register', () => {
		it('вызывает publicClient.post с нужным endpoint и телом', async () => {
			const body = { email: 'a@b.com', password: '123', name: 'Alex' }
			const responseData = {
				user: { id: '1', email: 'a@b.com', name: 'Alex' },
				accessToken: 'tok',
			}
			mockPost.mockResolvedValue(axiosResponse(responseData))

			const result = await authService.register(body)

			expect(mockPost).toHaveBeenCalledWith('/auth/register', body)
			expect(result).toEqual(responseData)
		})
	})

	describe('login', () => {
		it('вызывает publicClient.post с нужным endpoint и телом', async () => {
			const body = { email: 'a@b.com', password: '123' }
			const responseData = {
				user: { id: '1', email: 'a@b.com', name: null },
				accessToken: 'tok',
			}
			mockPost.mockResolvedValue(axiosResponse(responseData))

			const result = await authService.login(body)

			expect(mockPost).toHaveBeenCalledWith('/auth/login', body)
			expect(result).toEqual(responseData)
		})
	})

	describe('refresh', () => {
		it('вызывает publicClient.post без тела', async () => {
			const responseData = {
				user: { id: '1', email: 'a@b.com', name: null },
				accessToken: 'new',
			}
			mockPost.mockResolvedValue(axiosResponse(responseData))

			const result = await authService.refresh()

			expect(mockPost).toHaveBeenCalledWith('/auth/refresh')
			expect(result).toEqual(responseData)
		})
	})

	describe('logout', () => {
		it('вызывает publicClient.post и не возвращает данные', async () => {
			mockPost.mockResolvedValue(axiosResponse(undefined))

			await authService.logout()

			expect(mockPost).toHaveBeenCalledWith('/auth/logout')
		})
	})

	describe('getMe', () => {
		it('вызывает client.get и возвращает пользователя', async () => {
			const user = { id: '1', email: 'a@b.com', name: 'Alex' }
			mockGet.mockResolvedValue(axiosResponse(user))

			const result = await authService.getMe()

			expect(mockGet).toHaveBeenCalledWith('/auth/me')
			expect(result).toEqual(user)
		})
	})
})
