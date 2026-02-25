import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

import { ApiError } from './types'

const client = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_URL,
	headers: {
		'Content-Type': 'application/json',
	},
	timeout: 10000,
})

// Request interceptor
client.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		// Здесь можно добавить токен авторизации
		// const token = getAuthToken()
		// if (token) {
		//   config.headers.Authorization = `Bearer ${token}`
		// }
		return config
	},
	(error: AxiosError) => Promise.reject(error),
)

// Response interceptor
client.interceptors.response.use(
	(response) => response,
	(error: AxiosError<ApiError>) => {
		const apiError: ApiError = {
			message: error.response?.data?.message || error.message || 'Unknown error',
			statusCode: error.response?.status || 500,
			error: error.response?.data?.error || 'Error',
		}

		return Promise.reject(apiError)
	},
)

export { client }
