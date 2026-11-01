'use client'

import { useSearchParams } from 'next/navigation'
import { useDeferredValue, useMemo } from 'react'

import {
	DEFAULT_TASK_SORT_BY,
	DEFAULT_TASK_SORT_ORDER,
	taskFilterQuerySchema,
	type TaskFilterParams,
} from '@repo/types'

const shape = taskFilterQuerySchema.shape
const urlSchema = taskFilterQuerySchema.extend({
	page: shape.page.catch(1),
	limit: shape.limit.default(20).catch(20),
	status: shape.status.catch(undefined),
	priority: shape.priority.catch(undefined),
	type: shape.type.catch(undefined),
	assigneeId: shape.assigneeId.catch(undefined),
	search: shape.search.catch(undefined),
	sortBy: shape.sortBy.catch(DEFAULT_TASK_SORT_BY),
	sortOrder: shape.sortOrder.catch(DEFAULT_TASK_SORT_ORDER),
})
const filterKeys = [
	'search',
	'status',
	'priority',
	'type',
	'assigneeId',
	'sortBy',
	'sortOrder',
	'page',
] as const

export function parseTaskFilters(params: URLSearchParams) {
	return urlSchema.parse(Object.fromEntries(params))
}

export function useTaskFilters() {
	const search = useSearchParams().toString()
	const filters = useMemo(() => parseTaskFilters(new URLSearchParams(search)), [search])
	const deferredSearch = useDeferredValue(filters.search)
	const write = (patch: TaskFilterParams, resetPage = true, reset = false) => {
		const params = new URLSearchParams(window.location.search)
		if (reset) filterKeys.forEach((key) => params.delete(key))
		for (const [key, value] of Object.entries(patch)) {
			if (value === undefined || value === '' || (key === 'page' && value === 1))
				params.delete(key)
			else params.set(key, String(value))
		}
		if (resetPage) params.delete('page')
		const query = params.toString()
		window.history.replaceState(
			null,
			'',
			`${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`,
		)
	}
	return {
		filters,
		query: { ...filters, search: deferredSearch || undefined },
		pending: deferredSearch !== filters.search,
		hasFilters: Boolean(
			filters.search?.trim() ||
			filters.status ||
			filters.priority ||
			filters.type ||
			filters.assigneeId,
		),
		update: (patch: TaskFilterParams) => write(patch),
		setPage: (page: number) => write({ page }, false),
		reset: () => write({}, true, true),
	}
}
