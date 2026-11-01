'use client'

import { useSearchParams } from 'next/navigation'

export function useTaskDialogRoute() {
	const params = useSearchParams()
	const write = (taskId: string | null) => {
		const next = new URLSearchParams(window.location.search)
		if (taskId) next.set('taskId', taskId)
		else next.delete('taskId')
		const query = next.toString()
		const href = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
		if (taskId) window.history.pushState(null, '', href)
		else window.history.replaceState(null, '', href)
	}
	return {
		href: (taskId: string) => {
			const next = new URLSearchParams(params.toString())
			next.set('taskId', taskId)
			return `?${next}`
		},
		taskId: params.get('taskId'),
		open: (taskId: string) => write(taskId),
		close: () => write(null),
	}
}
