'use client'

import { refreshAccessToken } from './refresh-access-token'
import { useSessionStore } from './session-store'

let refreshPromise: Promise<string | null> | null = null

const refreshSessionToken = async () => {
	if (refreshPromise) {
		return refreshPromise
	}

	refreshPromise = (async () => {
		try {
			const accessToken = await refreshAccessToken()
			useSessionStore.getState().setAuthenticated(accessToken)
			return accessToken
		} catch {
			useSessionStore.getState().clear()
			return null
		} finally {
			refreshPromise = null
		}
	})()

	return refreshPromise
}

export { refreshSessionToken }
