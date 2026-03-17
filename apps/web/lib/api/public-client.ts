import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

import { isClientSide, setCookieHeader } from './auth-cookies'
import { axiosConfig } from './axios-config'
import { toApiError } from './utils'

const publicClient = axios.create(axiosConfig)

publicClient.interceptors.request.use(
	async (request: InternalAxiosRequestConfig) => {
		if (!isClientSide()) {
			await setCookieHeader(request)
		}

		return request
	},
	(error: AxiosError) => Promise.reject(error),
)

publicClient.interceptors.response.use(
	(response) => response,
	(error) => Promise.reject(toApiError(error)),
)

export { publicClient }
