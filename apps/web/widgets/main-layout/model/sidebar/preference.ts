export const SIDEBAR_COOKIE_NAME = 'sidebar-state'

export function parseSidebarOpen(value: string | undefined, fallback = true): boolean {
	return value === 'false' ? false : value === 'true' ? true : fallback
}

export function readSidebarCookie(): string | undefined {
	try {
		return document.cookie
			.split(';')
			.map((item) => item.trim())
			.find((item) => item.startsWith(`${SIDEBAR_COOKIE_NAME}=`))
			?.slice(SIDEBAR_COOKIE_NAME.length + 1)
	} catch {
		return undefined
	}
}

export function writeSidebarCookie(isOpen: boolean | undefined) {
	if (typeof document === 'undefined') return
	try {
		document.cookie = `${SIDEBAR_COOKIE_NAME}=${isOpen ?? ''}; Path=/; Max-Age=${isOpen === undefined ? 0 : 31536000}; SameSite=Lax`
	} catch {
		return
	}
}

export function readClientSidebarOpen(fallback: boolean): boolean {
	const cookie = readSidebarCookie()
	if (cookie !== undefined) return parseSidebarOpen(cookie, fallback)
	try {
		const previous = JSON.parse(localStorage.getItem(SIDEBAR_COOKIE_NAME) ?? 'null')
		if (
			(previous?.version === undefined || previous.version === 0) &&
			typeof previous?.state?.isOpen === 'boolean'
		) {
			writeSidebarCookie(previous.state.isOpen)
			if (readSidebarCookie() === String(previous.state.isOpen))
				localStorage.removeItem(SIDEBAR_COOKIE_NAME)
			return previous.state.isOpen
		}
	} catch {
		return fallback
	}
	return fallback
}
