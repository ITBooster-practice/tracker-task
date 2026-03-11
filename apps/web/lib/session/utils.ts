import { jwtDecode } from 'jwt-decode'

const getTokenExpiration = (token: string) => {
	try {
		const { exp } = jwtDecode(token)
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
