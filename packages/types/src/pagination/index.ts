import { z } from 'zod'

import {
	DEFAULT_LIMIT,
	DEFAULT_PAGE,
	MAX_LIMIT,
	MIN_LIMIT,
	MIN_PAGE,
} from './constants/pagination.constants'

const PAGINATION_ERROR_MESSAGES = {
	PAGE_TYPE: 'Номер страницы должен быть числом',
	PAGE_INTEGER: 'Номер страницы должен быть целым числом',
	PAGE_MIN: 'Номер страницы должен быть не меньше 1',
	LIMIT_TYPE: 'Лимит должен быть числом',
	LIMIT_INTEGER: 'Лимит должен быть целым числом',
	LIMIT_MIN: 'Лимит должен быть не меньше 1',
	LIMIT_MAX: `Лимит должен быть не больше ${MAX_LIMIT}`,
} as const

export const paginationQuerySchema = z.object({
	page: z.coerce
		.number({ message: PAGINATION_ERROR_MESSAGES.PAGE_TYPE })
		.int({ message: PAGINATION_ERROR_MESSAGES.PAGE_INTEGER })
		.min(MIN_PAGE, { message: PAGINATION_ERROR_MESSAGES.PAGE_MIN })
		.default(DEFAULT_PAGE),
	limit: z.coerce
		.number({ message: PAGINATION_ERROR_MESSAGES.LIMIT_TYPE })
		.int({ message: PAGINATION_ERROR_MESSAGES.LIMIT_INTEGER })
		.min(MIN_LIMIT, { message: PAGINATION_ERROR_MESSAGES.LIMIT_MIN })
		.max(MAX_LIMIT, { message: PAGINATION_ERROR_MESSAGES.LIMIT_MAX })
		.default(DEFAULT_LIMIT),
})

export interface PaginationMeta {
	page: number
	limit: number
	total: number
	totalPages: number
}

export interface PaginatedResponse<T> {
	data: T[]
	meta: PaginationMeta
}

export interface PaginationParams {
	page?: number
	limit?: number
}

export type PaginationQuery = z.infer<typeof paginationQuerySchema>

export * from './constants/pagination.constants'
