const DESKTOP_MATCH_MEDIA_QUERY = '(min-width: 768px)'

let originalMatchMedia: typeof window.matchMedia | undefined

export function installDesktopMatchMediaMock() {
	if (!originalMatchMedia) {
		originalMatchMedia = window.matchMedia
	}

	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: (query: string) => ({
			matches: query === DESKTOP_MATCH_MEDIA_QUERY,
			media: query,
			onchange: null,
			addListener: () => undefined,
			removeListener: () => undefined,
			addEventListener: () => undefined,
			removeEventListener: () => undefined,
			dispatchEvent: () => false,
		}),
	})
}

export function restoreMatchMediaMock() {
	if (!originalMatchMedia) {
		return
	}

	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: originalMatchMedia,
	})
}
