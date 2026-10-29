import { useSyncExternalStore } from 'react'
import { vi } from 'vitest'

const push = window.history.pushState.bind(window.history)
const replace = window.history.replaceState.bind(window.history)
const notify = () => window.dispatchEvent(new Event('board-history'))
const subscribe = (listener: () => void) => {
	window.addEventListener('popstate', listener)
	window.addEventListener('board-history', listener)
	return () => {
		window.removeEventListener('popstate', listener)
		window.removeEventListener('board-history', listener)
	}
}

// Next integrates native History API calls with useSearchParams.
export const useBoardSearchParamsMock = () =>
	new URLSearchParams(
		useSyncExternalStore(
			subscribe,
			() => window.location.search,
			() => '',
		),
	)

export function resetBoardHistoryMock(url = '/teams/team-1/projects/project-1/board') {
	vi.spyOn(window.history, 'pushState').mockImplementation((...args) => {
		push(...args)
		notify()
	})
	vi.spyOn(window.history, 'replaceState').mockImplementation((...args) => {
		replace(...args)
		notify()
	})
	window.history.replaceState(null, '', url)
}
