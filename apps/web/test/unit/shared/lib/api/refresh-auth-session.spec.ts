import { beforeEach, describe, expect, it, vi } from 'vitest'

import { refreshAuthSession } from '@/shared/lib/api/refresh-auth-session'
import { requestAuthRefresh } from '@/shared/lib/api/request-auth-refresh'

vi.mock('@/shared/lib/api/request-auth-refresh', () => ({
	requestAuthRefresh: vi.fn(),
}))

const mockRequestAuthRefresh = vi.mocked(requestAuthRefresh)

describe('refreshAuthSession', () => {
	beforeEach(() => {
		vi.restoreAllMocks()
	})

	it('успешный вызов', async () => {
		mockRequestAuthRefresh.mockResolvedValue({
			accessToken: 'token',
			setCookies: [],
		})

		const result = await refreshAuthSession()

		expect(result).toEqual({ accessToken: 'token', setCookies: [] })
		expect(mockRequestAuthRefresh).toHaveBeenCalledTimes(1)
	})

	it('два параллельных вызова', async () => {
		mockRequestAuthRefresh.mockResolvedValue({
			accessToken: 'token',
			setCookies: [],
		})

		// Вызываем параллельно, НЕ await-им сразу
		const first = refreshAuthSession()
		const second = refreshAuthSession()

		const [result1, result2] = await Promise.all([first, second])

		expect(result1).toEqual(result2)
		expect(mockRequestAuthRefresh).toHaveBeenCalledTimes(1)
	})

	it('ошибка', async () => {
		mockRequestAuthRefresh.mockRejectedValue(new Error('401'))

		const result = await refreshAuthSession()

		expect(result).toBeNull()
	})

	it('после ошибки=', async () => {
		mockRequestAuthRefresh.mockRejectedValueOnce(new Error('fail'))
		mockRequestAuthRefresh.mockResolvedValueOnce({
			accessToken: 'new-token',
			setCookies: [],
		})

		// Первый вызов — ошибка
		await refreshAuthSession()

		// Второй вызов — новый запрос, не переиспользует старый промис
		const result = await refreshAuthSession()

		expect(result).toEqual({ accessToken: 'new-token', setCookies: [] })
		expect(mockRequestAuthRefresh).toHaveBeenCalledTimes(2)
	})
})
