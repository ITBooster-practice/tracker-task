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
