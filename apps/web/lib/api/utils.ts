import { ApiError } from './types'

export const isApiError = (err: unknown): err is ApiError =>
	typeof err === 'object' && err !== null && 'message' in err && 'statusCode' in err
