import { AxiosResponse } from 'axios'

// Базовый тип ошибки API
export interface ApiError {
	message: string
	statusCode: number
	error?: string
}

// Обёртка для одиночного ответа
export type ApiResponse<T> = AxiosResponse<T>

// Пагинированный ответ
export interface PaginatedResponse<T> {
	data: T[]
	meta: PaginationMeta
}

export interface PaginationMeta {
	page: number
	limit: number
	total: number
	totalPages: number
}

// Параметры пагинации для запросов
export interface PaginationParams {
	page?: number
	limit?: number
}

// Базовый тип для сущностей с ID и timestamps
export interface BaseEntity {
	id: string
	createdAt: string
	updatedAt: string
}

// Тип для создания сущности (без id и timestamps)
export type CreateDto<T extends BaseEntity> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>

// Тип для обновления сущности (все поля опциональны, кроме системных)
export type UpdateDto<T extends BaseEntity> = Partial<
	Omit<T, 'id' | 'createdAt' | 'updatedAt'>
>
