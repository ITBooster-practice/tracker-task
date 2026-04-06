import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'

import { type ApiError } from '@/shared/lib/api/types'
import { isApiError, toApiError } from '@/shared/lib/api/utils'

describe('isApiError', () => {
	it('нормализованный ApiError → true', () => {
		expect(isApiError({ message: 'Not found', statusCode: 404 })).toBe(true)
	})

	it('null', () => {
		expect(isApiError(null)).toBe(false)
	})

	it('строка', () => {
		expect(isApiError('error')).toBe(false)
	})

	it('обычный Error → false', () => {
		expect(isApiError(new Error('boom'))).toBe(false)
	})

	it('AxiosError → false, пока не прошёл через toApiError', () => {
		const error = new AxiosError('Request failed')

		expect(isApiError(error)).toBe(false)
	})
})

describe('toApiError', () => {
	it('из AxiosError с response.data.message копирует сообщение и статус', () => {
		const error = new AxiosError('axios error', '400', undefined, undefined, {
			status: 400,
			data: { message: 'Bad request', statusCode: 400, error: 'Validation' },
			statusText: 'Bad Request',
			headers: {},
			config: { headers: new AxiosHeaders() },
		})

		const result = toApiError(error)

		expect(result).toEqual({
			message: 'Bad request',
			statusCode: 400,
			error: 'Validation',
		})
	})

	it('AxiosError без response (network error) → generic 503', () => {
		const error = new AxiosError('Network failed') as AxiosError<ApiError>

		const result = toApiError(error)

		expect(result).toEqual({
			message: 'Network failed',
			statusCode: 503,
			error: 'Error',
		})
	})

	it('AxiosError timeout без response → generic 504', () => {
		const error = new AxiosError('timeout', 'ECONNABORTED') as AxiosError<ApiError>

		const result = toApiError(error)

		expect(result).toEqual({
			message: 'timeout',
			statusCode: 504,
			error: 'Error',
		})
	})

	it("не-Axios ошибка → { statusCode: 500, message: '...' }", () => {
		const result = toApiError(new Error('Something broke'))

		expect(result).toEqual({
			message: 'Something broke',
			statusCode: 500,
			error: 'Error',
		})
	})

	it('пустое сообщение даёт Unknown error', () => {
		const error = new AxiosError('') as AxiosError<ApiError>
		const result = toApiError(error)

		expect(result).toEqual({
			message: 'Network error',
			statusCode: 503,
			error: 'Error',
		})
	})
})
