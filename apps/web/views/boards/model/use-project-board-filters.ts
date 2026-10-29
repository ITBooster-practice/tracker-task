'use client'

import { useSearchParams } from 'next/navigation'
import { useDeferredValue, useMemo } from 'react'

import { parseBoardGrouping, type BoardGrouping } from './board-swimlanes'
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
	const grouping = useMemo(
		() => parseBoardGrouping(new URLSearchParams(search)),
		[search],
	)
	const writeParams = (params: URLSearchParams, replace = false) => {
		const next = params.toString()
		if (next === new URLSearchParams(window.location.search).toString()) return
		const href = `${window.location.pathname}${next ? `?${next}` : ''}${window.location.hash}`
		if (replace) window.history.replaceState(null, '', href)
		else window.history.pushState(null, '', href)
	}
	const update = (patch: Partial<ProjectBoardFilters>, replace = false) => {
		const current = new URLSearchParams(window.location.search)
		const next = projectBoardFilterParams(current, {
			...parseProjectBoardFilters(current),
			...patch,
		})
		writeParams(next, replace)
	}
	return {
		grouping,
		setGrouping: (mode: BoardGrouping) => {
			const params = new URLSearchParams(window.location.search)
			if (mode === 'none') params.delete('groupBy')
			else params.set('groupBy', mode)
			writeParams(params)
		},
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
