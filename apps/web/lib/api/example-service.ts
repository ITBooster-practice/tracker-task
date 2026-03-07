/**
 * Этот файл демонстрирует паттерн создания API сервисов.
 * Скопируйте его и адаптируйте для своей сущности.
 */

import { client } from './client'
import {
	BaseEntity,
	CreateDto,
	PaginatedResponse,
	PaginationParams,
	UpdateDto,
} from './types'

// 1. Определите тип вашей сущности
export interface Example extends BaseEntity {
	title: string
	description: string
	status: 'active' | 'inactive'
}

// 2. Типы для создания и обновления выводятся автоматически
export type CreateExampleDto = CreateDto<Example>
export type UpdateExampleDto = UpdateDto<Example>

// 3. Определите endpoint
const ENDPOINT = '/examples'

// 4. Реализуйте CRUD функции
export const exampleService = {
	getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Example>> => {
		const response = await client.get<PaginatedResponse<Example>>(ENDPOINT, { params })
		return response.data
	},

	getById: async (id: string): Promise<Example> => {
		const response = await client.get<Example>(`${ENDPOINT}/${id}`)
		return response.data
	},

	create: async (data: CreateExampleDto): Promise<Example> => {
		const response = await client.post<Example>(ENDPOINT, data)
		return response.data
	},

	update: async (id: string, data: UpdateExampleDto): Promise<Example> => {
		const response = await client.patch<Example>(`${ENDPOINT}/${id}`, data)
		return response.data
	},

	delete: async (id: string): Promise<void> => {
		await client.delete(`${ENDPOINT}/${id}`)
	},
}
