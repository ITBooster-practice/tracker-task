import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { isClientSide, setCookieHeader } from '@/shared/lib/api/auth-cookies'
import { client } from '@/shared/lib/api/client'
import { refreshAuthSession } from '@/shared/lib/api/refresh-auth-session'

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

interface InterceptorHandler<T> {
	fulfilled: (value: T) => T | Promise<T>
	rejected: (error: unknown) => Promise<never>
}

vi.mock('@/shared/lib/api/auth-cookies', () => ({
	isClientSide: vi.fn(),
	setCookieHeader: vi.fn(),
}))

vi.mock('@/shared/lib/api/refresh-auth-session', () => ({
	refreshAuthSession: vi.fn(),
}))

const mockIsClientSide = vi.mocked(isClientSide)
const mockSetCookieHeader = vi.mocked(setCookieHeader)
const mockRefreshAuthSession = vi.mocked(refreshAuthSession)

// Хелперы для доступа к interceptors
function getRequestInterceptor(): InterceptorHandler<InternalAxiosRequestConfig> {
	return (
		client.interceptors.request as unknown as {
			handlers: InterceptorHandler<InternalAxiosRequestConfig>[]
		}
	).handlers[0]!
}

function getResponseInterceptor(): InterceptorHandler<unknown> {
	return (
		client.interceptors.response as unknown as { handlers: InterceptorHandler<unknown>[] }
	).handlers[0]!
}

function create401Error(config: Partial<RetryableConfig> = {}) {
	const error = new AxiosError('Unauthorized', '401', undefined, undefined, {
		status: 401,
		data: { message: 'Unauthorized', statusCode: 401 },
		statusText: 'Unauthorized',
		headers: {},
		config: { headers: new AxiosHeaders() },
	})
	error.config = { headers: new AxiosHeaders(), ...config } as RetryableConfig
	return error
}

describe('client', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('request interceptor', () => {
		it('SSR — прокидывает cookies в request', async () => {
			mockIsClientSide.mockReturnValue(false)
			mockSetCookieHeader.mockResolvedValue()

			const interceptor = getRequestInterceptor()
			const request = { headers: new AxiosHeaders() }

			await interceptor.fulfilled(request)

			expect(mockSetCookieHeader).toHaveBeenCalledWith(request)
		})

		it('браузер — не трогает cookies', async () => {
			mockIsClientSide.mockReturnValue(true)

			const interceptor = getRequestInterceptor()
			const request = { headers: new AxiosHeaders() }

			await interceptor.fulfilled(request)

			expect(mockSetCookieHeader).not.toHaveBeenCalled()
		})

		it('ошибка в request — пробрасывает reject', async () => {
			const interceptor = getRequestInterceptor()
			const error = new AxiosError('request failed')

			await expect(interceptor.rejected(error)).rejects.toThrow('request failed')
		})
	})

	describe('response interceptor', () => {
		it('успешный ответ', () => {
			const interceptor = getResponseInterceptor()
			const response = { data: { ok: true }, status: 200 }

			const result = interceptor.fulfilled(response)

			expect(result).toEqual(response)
		})

		it('401 + успешный refresh (SSR)', async () => {
			mockIsClientSide.mockReturnValue(false)
			mockRefreshAuthSession.mockResolvedValue({
				accessToken: 'new-token',
				setCookies: [],
			})

			const interceptor = getResponseInterceptor()
			const error = create401Error({ _retry: false })

			// retry вызовет client() который упадёт без сервера — ловим
			try {
				await interceptor.rejected(error)
			} catch {
				// ожидаемо
			}

			expect(mockRefreshAuthSession).toHaveBeenCalledTimes(1)
			expect(mockSetCookieHeader).toHaveBeenCalledWith(error.config)
			expect((error.config as RetryableConfig)._retry).toBe(true)
		})

		it('401 + refresh провалился (браузер)', async () => {
			mockIsClientSide.mockReturnValue(true)
			mockRefreshAuthSession.mockResolvedValue(null)

			const mockAssign = vi.fn()
			const originalLocation = window.location
			Object.defineProperty(window, 'location', {
				value: { origin: 'http://localhost:3000', assign: mockAssign },
				writable: true,
			})

			const interceptor = getResponseInterceptor()
			const error = create401Error({ _retry: false })

			await interceptor.rejected(error).catch(() => {})

			expect(mockAssign).toHaveBeenCalledTimes(1)
			const redirectUrl = mockAssign.mock.calls[0]![0].toString()
			expect(redirectUrl).toContain('/login')
			expect(redirectUrl).toContain('clearAuth=1')

			Object.defineProperty(window, 'location', {
				value: originalLocation,
				writable: true,
			})
		})

		it('401 + _retry=true — не пытается refresh повторно', async () => {
			const interceptor = getResponseInterceptor()
			const error = create401Error({ _retry: true })

			await expect(interceptor.rejected(error)).rejects.toEqual(
				expect.objectContaining({ statusCode: 401 }),
			)

			expect(mockRefreshAuthSession).not.toHaveBeenCalled()
		})

		it('500 ошибка — сразу reject без refresh', async () => {
			const interceptor = getResponseInterceptor()
			const error = new AxiosError('Server error', '500', undefined, undefined, {
				status: 500,
				data: { message: 'Internal error', statusCode: 500 },
				statusText: 'Internal Server Error',
				headers: {},
				config: { headers: new AxiosHeaders() },
			})
			error.config = { headers: new AxiosHeaders() } as RetryableConfig

			await expect(interceptor.rejected(error)).rejects.toEqual(
				expect.objectContaining({ statusCode: 500, message: 'Internal error' }),
			)

			expect(mockRefreshAuthSession).not.toHaveBeenCalled()
		})
	})
})
