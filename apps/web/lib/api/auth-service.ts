import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@repo/types'

import { client } from './client'
import { publicClient } from './public-client'

export type { AuthResponse, LoginRequest, RegisterRequest, User }

export type RegisterResponse = AuthResponse
export type LoginResponse = AuthResponse
export type RefreshResponse = AuthResponse

const ENDPOINT = '/auth'

export const authService = {
	register: async (body: RegisterRequest): Promise<RegisterResponse> => {
		const response = await publicClient.post<RegisterResponse>(
			`${ENDPOINT}/register`,
			body,
		)

		return response.data
	},

	login: async (body: LoginRequest): Promise<LoginResponse> => {
		const response = await publicClient.post<LoginResponse>(`${ENDPOINT}/login`, body)

		return response.data
	},

	refresh: async (): Promise<RefreshResponse> => {
		const response = await publicClient.post<RefreshResponse>(`${ENDPOINT}/refresh`)

		return response.data
	},

	logout: async () => {
		await publicClient.post(`${ENDPOINT}/logout`)
	},

	getMe: async (): Promise<User> => {
		const response = await client.get<User>(`${ENDPOINT}/me`)

		return response.data
	},
}
