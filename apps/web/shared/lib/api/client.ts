import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

import { ROUTE_QUERY_PARAMS, ROUTES } from '@/shared/config'

import { isClientSide, setCookieHeader } from './auth-cookies'
import { axiosConfig } from './axios-config'
import { refreshAuthSession } from './refresh-auth-session'
import type { ApiError } from './types'
import { toApiError } from './utils'

type RetryableConfig = InternalAxiosRequestConfig & {
	_retry?: boolean
}

const client = axios.create(axiosConfig)

client.interceptors.request.use(
	async (request: InternalAxiosRequestConfig) => {
		if (!isClientSide()) {
			await setCookieHeader(request)
		}

		return request
	},
	(error: AxiosError) => Promise.reject(error),
)

client.interceptors.response.use(
	(response) => response,
	async (error: AxiosError<ApiError>) => {
		const originalRequest = error.config as RetryableConfig | undefined

		if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
			originalRequest._retry = true

			const refreshResult = await refreshAuthSession()
			if (refreshResult) {
				if (!isClientSide()) {
					await setCookieHeader(originalRequest)
				}

				return client(originalRequest)
			}

			if (isClientSide()) {
				const url = new URL(ROUTES.login, window.location.origin)
				url.searchParams.set(ROUTE_QUERY_PARAMS.clearAuth, '1')
				window.location.assign(url)
			}
		}

		return Promise.reject(toApiError(error))
	},
)

export { client }
