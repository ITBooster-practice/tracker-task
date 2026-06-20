import { vi, type MockedFunction } from 'vitest'

type TasksService = typeof import('@/shared/lib/api/tasks-service').tasksService

type MockedTasksService = {
	getAll: MockedFunction<TasksService['getAll']>
	getById: MockedFunction<TasksService['getById']>
	create: MockedFunction<TasksService['create']>
	update: MockedFunction<TasksService['update']>
	delete: MockedFunction<TasksService['delete']>
}

export const tasksServiceMock: MockedTasksService = {
	getAll: vi.fn<TasksService['getAll']>(),
	getById: vi.fn<TasksService['getById']>(),
	create: vi.fn<TasksService['create']>(),
	update: vi.fn<TasksService['update']>(),
	delete: vi.fn<TasksService['delete']>(),
}

export function resetTasksServiceMock() {
	for (const mockFn of Object.values(tasksServiceMock)) {
		mockFn.mockReset()
	}
}

vi.mock('@/shared/lib/api/tasks-service', () => ({
	tasksService: tasksServiceMock,
}))
