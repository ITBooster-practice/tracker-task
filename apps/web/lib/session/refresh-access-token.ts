'use client'

import { publicClient } from '@/lib/api/public-client'

import type { AuthResponse } from '@repo/types'

export const refreshAccessToken = async () => {
	const response = await publicClient.post<AuthResponse>('/auth/refresh')

	return response.data.accessToken
}
