# API Integration Pattern

Паттерн интеграции с API для frontend приложения.

## Структура файлов

```
apps/web/
├── lib/api/
│   ├── client.ts          # Axios instance с interceptors
│   ├── types.ts           # Базовые типы API
│   └── [entity]-service.ts # Сервисы для каждой сущности
├── hooks/api/
│   └── use-[entity].ts    # React Query хуки
```

## Добавление нового endpoint

### Шаг 1: Создать сервис

Создайте `apps/web/lib/api/[entity]-service.ts`:

```typescript
import { client } from './client'
import {
	ApiResponse,
	BaseEntity,
	CreateDto,
	PaginatedResponse,
	PaginationParams,
	UpdateDto,
} from './types'

// 1. Определите тип сущности
export interface Task extends BaseEntity {
	title: string
	description: string
	status: 'todo' | 'in_progress' | 'done'
}

// 2. Типы для DTO
export type CreateTaskDto = CreateDto<Task>
export type UpdateTaskDto = UpdateDto<Task>

// 3. Endpoint
const ENDPOINT = '/tasks'

// 4. CRUD функции
export const taskService = {
	getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Task>> => {
		const response = await client.get<PaginatedResponse<Task>>(ENDPOINT, { params })
		return response.data
	},

	getById: async (id: string): Promise<Task> => {
		const response = await client.get<ApiResponse<Task>>(`${ENDPOINT}/${id}`)
		return response.data.data
	},

	create: async (data: CreateTaskDto): Promise<Task> => {
		const response = await client.post<ApiResponse<Task>>(ENDPOINT, data)
		return response.data.data
	},

	update: async (id: string, data: UpdateTaskDto): Promise<Task> => {
		const response = await client.patch<ApiResponse<Task>>(`${ENDPOINT}/${id}`, data)
		return response.data.data
	},

	delete: async (id: string): Promise<void> => {
		await client.delete(`${ENDPOINT}/${id}`)
	},
}
```

### Шаг 2: Создать хуки

Создайте `apps/web/hooks/api/use-[entity].ts`:

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
	CreateTaskDto,
	Task,
	taskService,
	UpdateTaskDto,
} from '../../lib/api/task-service'
import { ApiError, PaginationParams } from '../../lib/api/types'

// Query keys
export const taskKeys = {
	all: ['tasks'] as const,
	lists: () => [...taskKeys.all, 'list'] as const,
	list: (params?: PaginationParams) => [...taskKeys.lists(), params] as const,
	details: () => [...taskKeys.all, 'detail'] as const,
	detail: (id: string) => [...taskKeys.details(), id] as const,
}

// Список
export const useTaskList = (params?: PaginationParams) => {
	return useQuery({
		queryKey: taskKeys.list(params),
		queryFn: () => taskService.getAll(params),
	})
}

// Детали
export const useTaskDetail = (id: string) => {
	return useQuery({
		queryKey: taskKeys.detail(id),
		queryFn: () => taskService.getById(id),
		enabled: !!id,
	})
}

// Создание
export const useTaskCreate = () => {
	const queryClient = useQueryClient()

	return useMutation<Task, ApiError, CreateTaskDto>({
		mutationFn: taskService.create,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
		},
	})
}

// Обновление
export const useTaskUpdate = () => {
	const queryClient = useQueryClient()

	return useMutation<Task, ApiError, { id: string; data: UpdateTaskDto }>({
		mutationFn: ({ id, data }) => taskService.update(id, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
			queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.id) })
		},
	})
}

// Удаление
export const useTaskDelete = () => {
	const queryClient = useQueryClient()

	return useMutation<void, ApiError, string>({
		mutationFn: taskService.delete,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
		},
	})
}
```

## Использование в компонентах

### Получение списка

```tsx
const TaskList = () => {
	const { data, isLoading, error } = useTaskList({ page: 1, limit: 10 })

	if (isLoading) return <div>Loading...</div>
	if (error) return <div>Error: {error.message}</div>

	return (
		<ul>
			{data?.data.map((task) => (
				<li key={task.id}>{task.title}</li>
			))}
		</ul>
	)
}
```

### Получение деталей

```tsx
const TaskDetail = ({ id }: { id: string }) => {
	const { data: task, isLoading } = useTaskDetail(id)

	if (isLoading) return <div>Loading...</div>

	return <div>{task?.title}</div>
}
```

### Создание

```tsx
const CreateTaskForm = () => {
  const { mutate, isPending } = useTaskCreate()

  const handleSubmit = (data: CreateTaskDto) => {
    mutate(data, {
      onSuccess: (task) => {
        console.log('Created:', task)
      },
      onError: (error) => {
        console.error('Error:', error.message)
      },
    })
  }

  return <form onSubmit={...}>...</form>
}
```

### Обновление

```tsx
const EditTaskForm = ({ id }: { id: string }) => {
	const { mutate, isPending } = useTaskUpdate()

	const handleSubmit = (data: UpdateTaskDto) => {
		mutate(
			{ id, data },
			{
				onSuccess: () => console.log('Updated'),
			},
		)
	}

	return <form>...</form>
}
```

### Удаление

```tsx
const DeleteButton = ({ id }: { id: string }) => {
	const { mutate, isPending } = useTaskDelete()

	return (
		<button onClick={() => mutate(id)} disabled={isPending}>
			Delete
		</button>
	)
}
```

## Конвенции именования

| Тип            | Паттерн               | Пример            |
| -------------- | --------------------- | ----------------- |
| Сервис         | `[entity]-service.ts` | `task-service.ts` |
| Хуки           | `use-[entity].ts`     | `use-task.ts`     |
| Query keys     | `[entity]Keys`        | `taskKeys`        |
| Хук списка     | `use[Entity]List`     | `useTaskList`     |
| Хук деталей    | `use[Entity]Detail`   | `useTaskDetail`   |
| Хук создания   | `use[Entity]Create`   | `useTaskCreate`   |
| Хук обновления | `use[Entity]Update`   | `useTaskUpdate`   |
| Хук удаления   | `use[Entity]Delete`   | `useTaskDelete`   |

## Референсные файлы

- Сервис: `apps/web/lib/api/example-service.ts`
- Хуки: `apps/web/hooks/api/use-example.ts`

## Тестирование API-клиента и interceptors

Для unit-тестов `apps/web/shared/lib/api/client.ts` важно полностью отключать реальную сеть.

### Почему это важно

Если в тесте выполняется retry-путь (`return client(originalRequest)`), JSDOM может попытаться сделать реальный XHR-запрос и вывести `AggregateError` в консоль.

### Рекомендуемый подход

В `beforeEach` подменяйте `client.defaults.adapter` на мок-реализацию:

```typescript
beforeEach(() => {
	vi.clearAllMocks()

	// В unit-тестах интерсепторов запрещаем реальные HTTP-запросы.
	client.defaults.adapter = vi.fn(async (config) => ({
		data: { ok: true },
		status: 200,
		statusText: 'OK',
		headers: {},
		config,
		request: {},
	}))
})
```

Так тест остаётся детерминированным и проверяет только логику интерсепторов, а не поведение сети/браузерной среды.
