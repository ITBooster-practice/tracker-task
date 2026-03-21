import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'

import { type ApiError } from '@/shared/lib/api/types'
import { isApiError, toApiError } from '@/shared/lib/api/utils'

describe('isApiError', () => {
	it('валидный ApiError', () => {
		expect(isApiError({ message: 'Not found', statusCode: 404 })).toBe(true)
	})

	it('без message', () => {
		expect(isApiError({ statusCode: 404 })).toBe(false)
	})

	it('без statusCode', () => {
		expect(isApiError({ message: 'err' })).toBe(false)
	})

	it('null', () => {
		expect(isApiError(null)).toBe(false)
	})

	it('строка', () => {
		expect(isApiError('error')).toBe(false)
	})
})

describe('toApiError', () => {
	it('полный ответ — берёт данные из response.data', () => {
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

	it('пустой data — fallback на error.message и status', () => {
		const error = new AxiosError('Network failed', '500', undefined, undefined, {
			status: 400,
			data: {} as ApiError,
			statusText: 'Internal Server Error',
			headers: {},
			config: { headers: new AxiosHeaders() },
		})

		const result = toApiError(error)

		expect(result).toEqual({
			message: 'Network failed',
			statusCode: 400,
			error: 'Error',
		})
	})

	it('нет response — fallback на defaults', () => {
		const error = new AxiosError('timeout') as AxiosError<ApiError>

		const result = toApiError(error)

		expect(result).toEqual({
			message: 'timeout',
			statusCode: 500,
			error: 'Error',
		})
	})

	it('нет ни response ни message — Unknown error', () => {
		const error = new AxiosError('') as AxiosError<ApiError>

		const result = toApiError(error)

		expect(result).toEqual({
			message: 'Unknown error',
			statusCode: 500,
			error: 'Error',
		})
	})
})
