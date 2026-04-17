import type { PaginatedResponse, PaginationMeta } from '@repo/types'

export interface PaginationOptions {
	page: number
	limit: number
}

export interface PaginationPrismaParams {
	skip: number
	take: number
}

export function getPaginationPrismaParams({
	page,
	limit,
}: PaginationOptions): PaginationPrismaParams {
	return {
		skip: (page - 1) * limit,
		take: limit,
	}
}

export function buildPaginationMeta(
	{ page, limit }: PaginationOptions,
	total: number,
): PaginationMeta {
	return {
		page,
		limit,
		total,
		totalPages: Math.ceil(total / limit),
	}
}

export function buildPaginatedResponse<T>(
	data: T[],
	pagination: PaginationOptions,
	total: number,
): PaginatedResponse<T> {
	return {
		data,
		meta: buildPaginationMeta(pagination, total),
	}
}
