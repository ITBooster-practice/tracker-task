import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

import { axiosConfig } from './axios-config'
import { ApiError } from './types'
import { toApiError } from './utils'

const client = axios.create(axiosConfig)

client.interceptors.request.use(
	async (request: InternalAxiosRequestConfig) => {
		return request
	},
	(error: AxiosError) => Promise.reject(error),
)

client.interceptors.response.use(
	(response) => response,
	async (error: AxiosError<ApiError>) => {
		return Promise.reject(toApiError(error))
	},
)

export { client }
