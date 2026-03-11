import type { AxiosRequestConfig } from 'axios'

export const axiosConfig: AxiosRequestConfig = {
	baseURL: process.env.NEXT_PUBLIC_API_URL,
	headers: {
		'Content-Type': 'application/json',
	},
	timeout: 10000,
	withCredentials: true,
}
