import { requestAuthRefresh, type AuthRefreshResult } from './request-auth-refresh'

let activeRefreshPromise: Promise<AuthRefreshResult | null> | null = null

const refreshAuthSession = async (): Promise<AuthRefreshResult | null> => {
	if (activeRefreshPromise) {
		return activeRefreshPromise
	}

	activeRefreshPromise = (async () => {
		try {
			return await requestAuthRefresh()
		} catch {
			return null
		} finally {
			activeRefreshPromise = null
		}
	})()

	return activeRefreshPromise
}

export { refreshAuthSession }
export type { AuthRefreshResult }
