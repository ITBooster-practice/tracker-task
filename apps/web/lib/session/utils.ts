import { jwtDecode } from 'jwt-decode'

const decodeToken = <T = any>(token: string): T => jwtDecode<T>(token)

const getTokenExpiration = (token: string) => {
	try {
		const { exp } = decodeToken<{ exp?: number }>(token)
		return exp ?? null
	} catch {
		return null
	}
}

const isTokenExpiredSoon = (token: string, leewayInSeconds = 30) => {
	const expiration = getTokenExpiration(token)

	if (!expiration) {
		return false
	}

	return expiration - leewayInSeconds <= Math.floor(Date.now() / 1000)
}

export { isTokenExpiredSoon }
