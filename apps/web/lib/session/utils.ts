const getTokenExpiration = (token: string) => {
	try {
		const [, payload] = token.split('.')

		if (!payload) {
			return null
		}

		const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
		const paddedPayload = normalizedPayload.padEnd(
			normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
			'=',
		)
		const decodedPayload = JSON.parse(atob(paddedPayload)) as { exp?: number }

		return decodedPayload.exp ?? null
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

export { getTokenExpiration, isTokenExpiredSoon }
