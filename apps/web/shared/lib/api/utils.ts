import axios from 'axios'

import { TASK_MOVE_CONFLICT_REASONS, type TaskMoveConflict } from '@repo/types'

import { type ApiError } from './types'

export const isApiError = (err: unknown): err is ApiError =>
	typeof err === 'object' &&
	err !== null &&
	'message' in err &&
	typeof err.message === 'string' &&
	'statusCode' in err &&
	typeof err.statusCode === 'number'

const isTaskMoveConflict = (value: unknown): value is TaskMoveConflict =>
	isApiError(value) &&
	value.statusCode === 409 &&
	'code' in value &&
	value.code === 'TASK_MOVE_CONFLICT' &&
	'taskId' in value &&
	typeof value.taskId === 'string' &&
	'reason' in value &&
	TASK_MOVE_CONFLICT_REASONS.some((reason) => reason === value.reason)

export const toApiError = (error: unknown): ApiError => {
	if (axios.isAxiosError<ApiError>(error)) {
		if (error.response) {
			const payload: unknown = error.response.data
			if (error.response.status === 409 && isTaskMoveConflict(payload)) {
				const conflict: TaskMoveConflict = {
					statusCode: 409,
					code: payload.code,
					taskId: payload.taskId,
					reason: payload.reason,
					message: payload.message,
				}
				return conflict
			}
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
