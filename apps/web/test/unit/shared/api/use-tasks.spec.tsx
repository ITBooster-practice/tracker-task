import '@/test/mocks/api/tasks-service.mock'

import {
	resetTasksServiceMock,
	tasksServiceMock,
} from '@/test/mocks/api/tasks-service.mock'
import { createTaskFixture } from '@/test/mocks/api/tasks.fixtures'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
	tasksKeys,
	useCreateTask,
	useDeleteTask,
	useTaskDetail,
	useTasksList,
	useUpdateTask,
} from '@/shared/api/use-tasks'

describe('use-tasks hooks', () => {
	let queryClient: QueryClient

	const createWrapper = () => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		})

		const Wrapper = ({ children }: React.PropsWithChildren) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		)
		Wrapper.displayName = 'UseTasksQueryClientWrapper'

		return Wrapper
	}

	beforeEach(() => {
		resetTasksServiceMock()
	})

	describe('useTasksList', () => {
		it('запрашивает список задач по teamId и projectId', async () => {
			const tasks = [
				createTaskFixture({ id: 'task-1', title: 'Task 1' }),
				createTaskFixture({ id: 'task-2', title: 'Task 2' }),
			]
			const paginatedResponse = {
				data: tasks,
				meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
			}

			tasksServiceMock.getAll.mockResolvedValue(paginatedResponse)

			const { result } = renderHook(() => useTasksList('team-1', 'project-1'), {
				wrapper: createWrapper(),
			})

			await waitFor(() => expect(result.current.isSuccess).toBe(true))

			expect(tasksServiceMock.getAll).toHaveBeenCalledWith(
				'team-1',
				'project-1',
				undefined,
			)
			expect(result.current.data).toEqual(paginatedResponse)
		})

		it('передаёт параметры фильтрации в сервис', async () => {
			const paginatedResponse = {
				data: [createTaskFixture({ status: 'TODO' })],
				meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
			}
			tasksServiceMock.getAll.mockResolvedValue(paginatedResponse)

			const { result } = renderHook(
				() => useTasksList('team-1', 'project-1', { status: 'TODO' }),
				{ wrapper: createWrapper() },
			)

			await waitFor(() => expect(result.current.isSuccess).toBe(true))

			expect(tasksServiceMock.getAll).toHaveBeenCalledWith('team-1', 'project-1', {
				status: 'TODO',
			})
		})

		it('не делает запрос, если teamId пустой', () => {
			const { result } = renderHook(() => useTasksList('', 'project-1'), {
				wrapper: createWrapper(),
			})

			expect(tasksServiceMock.getAll).not.toHaveBeenCalled()
			expect(result.current.fetchStatus).toBe('idle')
		})

		it('не делает запрос, если projectId пустой', () => {
			const { result } = renderHook(() => useTasksList('team-1', ''), {
				wrapper: createWrapper(),
			})

			expect(tasksServiceMock.getAll).not.toHaveBeenCalled()
			expect(result.current.fetchStatus).toBe('idle')
		})
	})

	describe('useTaskDetail', () => {
		it('запрашивает задачу по teamId, projectId и taskId', async () => {
			const task = createTaskFixture({ id: 'task-1' })
			tasksServiceMock.getById.mockResolvedValue(task)

			const { result } = renderHook(
				() => useTaskDetail('team-1', 'project-1', 'task-1'),
				{ wrapper: createWrapper() },
			)

			await waitFor(() => expect(result.current.isSuccess).toBe(true))

			expect(tasksServiceMock.getById).toHaveBeenCalledWith(
				'team-1',
				'project-1',
				'task-1',
			)
			expect(result.current.data).toEqual(task)
		})

		it('не делает запрос, если taskId пустой', () => {
			const { result } = renderHook(() => useTaskDetail('team-1', 'project-1', ''), {
				wrapper: createWrapper(),
			})

			expect(tasksServiceMock.getById).not.toHaveBeenCalled()
			expect(result.current.fetchStatus).toBe('idle')
		})

		it('не делает запрос, если projectId пустой', () => {
			const { result } = renderHook(() => useTaskDetail('team-1', '', 'task-1'), {
				wrapper: createWrapper(),
			})

			expect(tasksServiceMock.getById).not.toHaveBeenCalled()
			expect(result.current.fetchStatus).toBe('idle')
		})
	})

	describe('useCreateTask', () => {
		it('после создания обновляет кэш (setQueryData) и инвалидирует список', async () => {
			const task = createTaskFixture({ id: 'task-new', title: 'New Task' })
			tasksServiceMock.create.mockResolvedValue(task)

			const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries')

			const { result } = renderHook(() => useCreateTask(), {
				wrapper: createWrapper(),
			})

			result.current.mutate({
				teamId: 'team-1',
				projectId: 'project-1',
				data: { title: 'New Task' },
			})

			await waitFor(() => expect(result.current.isSuccess).toBe(true))

			expect(tasksServiceMock.create).toHaveBeenCalledWith('team-1', 'project-1', {
				title: 'New Task',
			})
			expect(
				queryClient.getQueryData(tasksKeys.detail('team-1', 'project-1', 'task-new')),
			).toEqual(task)
			expect(invalidateSpy).toHaveBeenCalledWith({
				queryKey: tasksKeys.projectLists('team-1', 'project-1'),
			})

			invalidateSpy.mockRestore()
		})
	})

	describe('useUpdateTask', () => {
		it('обновляет кэш задачи и инвалидирует список', async () => {
			const task = createTaskFixture({ id: 'task-1', title: 'Updated' })
			tasksServiceMock.update.mockResolvedValue(task)

			const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries')

			const { result } = renderHook(() => useUpdateTask(), {
				wrapper: createWrapper(),
			})

			result.current.mutate({
				teamId: 'team-1',
				projectId: 'project-1',
				taskId: 'task-1',
				data: { title: 'Updated' },
			})

			await waitFor(() => expect(result.current.isSuccess).toBe(true))

			expect(tasksServiceMock.update).toHaveBeenCalledWith(
				'team-1',
				'project-1',
				'task-1',
				{ title: 'Updated' },
			)
			expect(
				queryClient.getQueryData(tasksKeys.detail('team-1', 'project-1', 'task-1')),
			).toEqual(task)
			expect(invalidateSpy).toHaveBeenCalledWith({
				queryKey: tasksKeys.projectLists('team-1', 'project-1'),
			})

			invalidateSpy.mockRestore()
		})
	})

	describe('useDeleteTask', () => {
		it('инвалидирует список и удаляет detail из кэша', async () => {
			const task = createTaskFixture({ id: 'task-1' })

			queryClient = new QueryClient({
				defaultOptions: {
					queries: { retry: false },
					mutations: { retry: false },
				},
			})
			queryClient.setQueryData(tasksKeys.detail('team-1', 'project-1', 'task-1'), task)

			tasksServiceMock.delete.mockResolvedValue(undefined)

			const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

			const DeleteWrapper = ({ children }: React.PropsWithChildren) => (
				<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
			)
			DeleteWrapper.displayName = 'UseDeleteTaskQueryClientWrapper'

			const { result } = renderHook(() => useDeleteTask(), {
				wrapper: DeleteWrapper,
			})

			result.current.mutate({
				teamId: 'team-1',
				projectId: 'project-1',
				taskId: 'task-1',
			})

			await waitFor(() => expect(result.current.isSuccess).toBe(true))

			expect(tasksServiceMock.delete).toHaveBeenCalledWith(
				'team-1',
				'project-1',
				'task-1',
			)
			expect(invalidateSpy).toHaveBeenCalledWith({
				queryKey: tasksKeys.projectLists('team-1', 'project-1'),
			})
			expect(
				queryClient.getQueryData(tasksKeys.detail('team-1', 'project-1', 'task-1')),
			).toBeUndefined()

			invalidateSpy.mockRestore()
		})
	})
})
