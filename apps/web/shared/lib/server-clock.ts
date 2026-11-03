type ClockAnchor = { timestamp: number; receivedAt: number }

let anchor: ClockAnchor | null = null
let snapshot = Date.now()
let timer: ReturnType<typeof setInterval> | undefined
const listeners = new Set<() => void>()

const update = () => {
	snapshot = anchor
		? anchor.timestamp + performance.now() - anchor.receivedAt
		: Date.now()
	listeners.forEach((listener) => listener())
}

export function syncServerClock(date: unknown) {
	if (typeof date !== 'string') return
	const timestamp = Date.parse(date)
	if (!Number.isFinite(timestamp)) return
	anchor = { timestamp, receivedAt: performance.now() }
	update()
}

export const getServerNow = () => snapshot

export function subscribeServerClock(listener: () => void) {
	listeners.add(listener)
	if (listeners.size === 1) {
		update()
		timer = setInterval(update, 1000)
		window.addEventListener('focus', update)
		document.addEventListener('visibilitychange', update)
	}
	return () => {
		listeners.delete(listener)
		if (listeners.size === 0) {
			clearInterval(timer)
			timer = undefined
			window.removeEventListener('focus', update)
			document.removeEventListener('visibilitychange', update)
		}
	}
}
