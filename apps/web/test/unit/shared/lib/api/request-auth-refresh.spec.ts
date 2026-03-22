import { describe, expect, it, vi } from 'vitest'

import { publicClient } from '@/shared/lib/api/public-client'
import { requestAuthRefresh } from '@/shared/lib/api/request-auth-refresh'

// Мокаем publicClient — подменяем метод post
vi.mock('@/shared/lib/api/public-client', () => ({
	publicClient: {
		post: vi.fn(),
	},
}))

// Типизируем мок для автокомплита
const mockPost = vi.mocked(publicClient.post)

describe('requestAuthRefresh', () => {
	it('успешный ответ с set-cookie', async () => {
		mockPost.mockResolvedValue({
			data: { accessToken: 'new-token' },
			headers: { 'set-cookie': ['session=abc', 'refresh=xyz'] },
		})

		const result = await requestAuthRefresh()

		expect(mockPost).toHaveBeenCalledWith('/auth/refresh')
		expect(result).toEqual({
			accessToken: 'new-token',
			setCookies: ['session=abc', 'refresh=xyz'],
		})
	})

	it('ответ без set-cookie', async () => {
		mockPost.mockResolvedValue({
			data: { accessToken: 'token' },
			headers: {},
		})

		const result = await requestAuthRefresh()

		expect(result.setCookies).toEqual([])
	})

	it('ошибка сервера', async () => {
		mockPost.mockRejectedValue(new Error('Network error'))

		await expect(requestAuthRefresh()).rejects.toThrow('Network error')
	})
})
