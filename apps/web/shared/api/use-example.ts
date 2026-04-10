/**
 * Этот файл демонстрирует паттерн создания хуков для API.
 * Скопируйте его и адаптируйте для своей сущности.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { PaginationParams } from '@repo/types'

import {
	CreateExampleDto,
	Example,
	exampleService,
	UpdateExampleDto,
} from '@/shared/lib/api/example-service'
import { ApiError } from '@/shared/lib/api/types'

// Query keys для кэширования
export const exampleKeys = {
	all: ['examples'] as const,
	lists: () => [...exampleKeys.all, 'list'] as const,
	list: (params?: PaginationParams) => [...exampleKeys.lists(), params] as const,
	details: () => [...exampleKeys.all, 'detail'] as const,
	detail: (id: string) => [...exampleKeys.details(), id] as const,
}

// Хук для получения списка
export const useExampleList = (params?: PaginationParams) => {
	return useQuery({
		queryKey: exampleKeys.list(params),
		queryFn: () => exampleService.getAll(params),
	})
}

// Хук для получения одной сущности
export const useExampleDetail = (id: string) => {
	return useQuery({
		queryKey: exampleKeys.detail(id),
		queryFn: () => exampleService.getById(id),
		enabled: !!id,
	})
}

// Хук для создания
export const useExampleCreate = () => {
	const queryClient = useQueryClient()

	return useMutation<Example, ApiError, CreateExampleDto>({
		mutationFn: exampleService.create,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: exampleKeys.lists() })
		},
	})
}

// Хук для обновления
export const useExampleUpdate = () => {
	const queryClient = useQueryClient()

	return useMutation<Example, ApiError, { id: string; data: UpdateExampleDto }>({
		mutationFn: ({ id, data }) => exampleService.update(id, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: exampleKeys.lists() })
			queryClient.invalidateQueries({ queryKey: exampleKeys.detail(variables.id) })
		},
	})
}

// Хук для удаления
export const useExampleDelete = () => {
	const queryClient = useQueryClient()

	return useMutation<void, ApiError, string>({
		mutationFn: exampleService.delete,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: exampleKeys.lists() })
		},
	})
}
