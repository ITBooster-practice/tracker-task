import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { isClientSide, setCookieHeader } from '@/shared/lib/api/auth-cookies'
import { publicClient } from '@/shared/lib/api/public-client'
import { toApiError } from '@/shared/lib/api/utils'

interface InterceptorHandler<T> {
	fulfilled: (value: T) => T | Promise<T>
	rejected: (error: unknown) => Promise<never>
}

vi.mock('@/shared/lib/api/auth-cookies', () => ({
	isClientSide: vi.fn(),
	setCookieHeader: vi.fn(),
}))

vi.mock('@/shared/lib/api/utils', () => ({
	toApiError: vi.fn((error) => error),
}))

const mockIsClientSide = vi.mocked(isClientSide)
const mockSetCookieHeader = vi.mocked(setCookieHeader)
const mockToApiError = vi.mocked(toApiError)

function getRequestInterceptor(): InterceptorHandler<InternalAxiosRequestConfig> {
	return (
		publicClient.interceptors.request as unknown as {
			handlers: InterceptorHandler<InternalAxiosRequestConfig>[]
		}
	).handlers[0]!
}

function getResponseInterceptor(): InterceptorHandler<unknown> {
	return (
		publicClient.interceptors.response as unknown as {
			handlers: InterceptorHandler<unknown>[]
		}
	).handlers[0]!
}

describe('publicClient', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('request interceptor', () => {
		it('SSR — прокидывает cookies в request', async () => {
			mockIsClientSide.mockReturnValue(false)
			mockSetCookieHeader.mockResolvedValue()

			const interceptor = getRequestInterceptor()
			const request = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig

			await interceptor.fulfilled(request)

			expect(mockSetCookieHeader).toHaveBeenCalledWith(request)
		})

		it('браузер — не трогает cookies', async () => {
			mockIsClientSide.mockReturnValue(true)

			const interceptor = getRequestInterceptor()
			const request = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig

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
		it('успешный ответ — возвращает его без изменений', () => {
			const interceptor = getResponseInterceptor()
			const response = { data: { ok: true }, status: 200 }

			const result = interceptor.fulfilled(response)

			expect(result).toEqual(response)
		})

		it('ошибка — вызывает toApiError и возвращает reject', async () => {
			const interceptor = getResponseInterceptor()
			const error = new AxiosError('Network Error')
			const apiError = { message: 'Network Error', statusCode: 0 }
			mockToApiError.mockReturnValue(apiError as never)

			await expect(interceptor.rejected(error)).rejects.toEqual(apiError)
			expect(mockToApiError).toHaveBeenCalledWith(error)
		})
	})
})
