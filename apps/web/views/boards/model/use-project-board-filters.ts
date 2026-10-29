'use client'

import { useSearchParams } from 'next/navigation'
import { useDeferredValue, useMemo } from 'react'

import {
	emptyProjectBoardFilters,
	parseProjectBoardFilters,
	projectBoardFilterParams,
	type ProjectBoardFilters,
} from './project-board-filters'

export function useProjectBoardFilters() {
	const search = useSearchParams().toString()
	const filters = useMemo(
		() => parseProjectBoardFilters(new URLSearchParams(search)),
		[search],
	)
	const deferredQuery = useDeferredValue(filters.query)
	const update = (patch: Partial<ProjectBoardFilters>, replace = false) => {
		const current = new URLSearchParams(window.location.search)
		const next = projectBoardFilterParams(current, {
			...parseProjectBoardFilters(current),
			...patch,
		}).toString()
		if (next === current.toString()) return
		const href = `${window.location.pathname}${next ? `?${next}` : ''}${window.location.hash}`
		if (replace) window.history.replaceState(null, '', href)
		else window.history.pushState(null, '', href)
	}
	return {
		filters,
		effectiveFilters: useMemo(
			() => ({ ...filters, query: deferredQuery }),
			[filters, deferredQuery],
		),
		isPending: filters.query !== deferredQuery,
		update,
		reset: () => update(emptyProjectBoardFilters),
	}
}
