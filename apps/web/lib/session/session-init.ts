'use client'

import { refreshAccessToken } from './refresh-access-token'
import { useSessionStore } from './session-store'

let initPromise: Promise<void> | null = null

const initSession = async () => {
	const store = useSessionStore.getState()

	if (store.isInitialized) {
		return
	}

	if (initPromise) {
		return initPromise
	}

	initPromise = (async () => {
		try {
			const accessToken = await refreshAccessToken()
			useSessionStore.getState().setAuthenticated(accessToken)
		} catch {
			useSessionStore.getState().setGuest()
		} finally {
			initPromise = null
		}
	})()

	return initPromise
}

export { initSession }
