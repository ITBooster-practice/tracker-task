import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@repo/types'

import { client } from './client'
import { ApiResponse } from './types'

type RegisterResponse = AuthResponse
type LoginResponse = AuthResponse
type RefreshResponse = AuthResponse

const ENDPOINT = '/auth'

export const authService = {
	register: async (body: RegisterRequest): Promise<RegisterResponse> => {
		const response = await client.post<
			RegisterResponse,
			ApiResponse<RegisterResponse>,
			RegisterRequest
		>(`${ENDPOINT}/register`, body)

		return response.data
	},

	login: async (body: LoginRequest): Promise<LoginResponse> => {
		const response = await client.post<
			LoginResponse,
			ApiResponse<LoginResponse>,
			LoginRequest
		>(`${ENDPOINT}/login`, body)

		return response.data
	},

	refresh: async (): Promise<RefreshResponse> => {
		const response = await client.post<RefreshResponse>(`${ENDPOINT}/refresh`)

		return response.data
	},

	logout: async () => {
		return await client.post(`${ENDPOINT}/logout`)
	},

	getMe: async (): Promise<User> => {
		const response = await client.get<User>(`${ENDPOINT}/me`)

		return response.data
	},
}
