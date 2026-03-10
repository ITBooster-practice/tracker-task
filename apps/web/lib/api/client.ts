import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

import { isTokenExpiredSoon, refreshSessionToken, useSessionStore } from '../session'
import { axiosConfig } from './axios-config'
import { ApiError } from './types'
import { toApiError } from './utils'

type RetryableConfig = InternalAxiosRequestConfig & {
	_retry?: boolean
}

const client = axios.create(axiosConfig)

client.interceptors.request.use(
	async (request: InternalAxiosRequestConfig) => {
		let token = useSessionStore.getState().accessToken

		if (token && isTokenExpiredSoon(token)) {
			token = await refreshSessionToken()
		}

		if (token) {
			request.headers.set('Authorization', `Bearer ${token}`)
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

			const token = await refreshSessionToken()

			if (token) {
				originalRequest.headers.set('Authorization', `Bearer ${token}`)

				return client(originalRequest)
			}
		}

		return Promise.reject(toApiError(error))
	},
)

export { client }
