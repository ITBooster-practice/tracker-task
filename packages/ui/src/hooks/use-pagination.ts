import { useState } from 'react'

export interface UsePaginationOptions {
	initialPage?: number
	initialLimit?: number
}

export interface UsePaginationReturn {
	page: number
	limit: number
	setPage: (page: number) => void
	paginationParams: { page: number; limit: number }
}

/**
 * Хук для управления состоянием пагинации.
 * Возвращает `paginationParams` для передачи в API-запрос
 * и `setPage` для передачи в компонент `<Pagination>`.
 *
 * @example
 * const { paginationParams, setPage } = usePagination()
 * const { data } = useQuery({ queryFn: () => api.list(paginationParams) })
 * return <Pagination meta={data.meta} onPageChange={setPage} />
 */
export function usePagination({
	initialPage = 1,
	initialLimit = 10,
}: UsePaginationOptions = {}): UsePaginationReturn {
	const [page, setPage] = useState(initialPage)

	return {
		page,
		limit: initialLimit,
		setPage,
		paginationParams: { page, limit: initialLimit },
	}
}
