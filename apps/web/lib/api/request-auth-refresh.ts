import type { AuthResponse } from '@repo/types'

import { publicClient } from './public-client'

type AuthRefreshResult = {
	accessToken: string
	setCookies: string[]
}

const requestAuthRefresh = async (): Promise<AuthRefreshResult> => {
	const response = await publicClient.post<AuthResponse>('/auth/refresh')

	const setCookies = (response.headers['set-cookie'] as string[] | undefined) ?? []

	return {
		accessToken: response.data.accessToken,
		setCookies,
	} satisfies AuthRefreshResult
}

export { requestAuthRefresh }
export type { AuthRefreshResult }
