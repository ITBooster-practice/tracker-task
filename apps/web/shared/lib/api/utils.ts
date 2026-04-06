import axios from 'axios'

import { type ApiError } from './types'

export const isApiError = (err: unknown): err is ApiError =>
	typeof err === 'object' &&
	err !== null &&
	'message' in err &&
	typeof err.message === 'string' &&
	'statusCode' in err &&
	typeof err.statusCode === 'number'

export const toApiError = (error: unknown): ApiError => {
	if (axios.isAxiosError<ApiError>(error)) {
		if (error.response) {
			return {
				message: error.response.data?.message || error.message || 'Unknown error',
				statusCode: error.response.status || 500,
				error: error.response.data?.error || 'Error',
			}
		}

		return {
			message: error.message || 'Network error',
			statusCode: error.code === 'ECONNABORTED' ? 504 : 503,
			error: 'Error',
		}
	}

	if (error instanceof Error) {
		return {
			message: error.message || 'Unknown error',
			statusCode: 500,
			error: 'Error',
		}
	}

	return {
		message: 'Unknown error',
		statusCode: 500,
		error: 'Error',
	}
}
