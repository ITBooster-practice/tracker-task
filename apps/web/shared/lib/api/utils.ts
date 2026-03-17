import { AxiosError } from 'axios'

import { type ApiError } from './types'

export const isApiError = (err: unknown): err is ApiError =>
	typeof err === 'object' && err !== null && 'message' in err && 'statusCode' in err

export const toApiError = (error: AxiosError<ApiError>): ApiError => ({
	message: error.response?.data?.message || error.message || 'Unknown error',
	statusCode: error.response?.status || 500,
	error: error.response?.data?.error || 'Error',
})
