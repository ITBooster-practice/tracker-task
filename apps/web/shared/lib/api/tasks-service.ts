import type {
	CreateTask,
	PaginatedResponse,
	Task,
	TaskFilterParams,
	UpdateTask,
} from '@repo/types'

import { client } from './client'

const buildTasksEndpoint = (teamId: string, projectId: string) =>
	`/teams/${teamId}/projects/${projectId}/tasks`

const buildTaskEndpoint = (teamId: string, projectId: string, taskId: string) =>
	`/teams/${teamId}/projects/${projectId}/tasks/${taskId}`

// Mock data — remove together with USE_MOCK when backend controller exposes routes
const USE_MOCK = true

const MOCK_TASKS: Task[] = [
	{
		id: 'mock-task-1',
		title: 'Настроить CI/CD pipeline',
		description: 'Настроить автоматическую сборку и деплой через GitHub Actions',
		type: 'EPIC',
		status: 'IN_PROGRESS',
		priority: 'HIGH',
		position: 1,
		projectId: 'mock-project-1',
		assigneeId: null,
		dueDate: null,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	{
		id: 'mock-task-2',
		title: 'Реализовать авторизацию пользователя',
		description: null,
		type: 'STORY',
		status: 'DONE',
		priority: 'CRITICAL',
		position: 1,
		projectId: 'mock-project-1',
		assigneeId: null,
		dueDate: '2025-12-31T23:59:59.000Z',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	{
		id: 'mock-task-3',
		title: 'Исправить баг с токеном обновления',
		description: 'Refresh-токен не сбрасывается при выходе из аккаунта',
		type: 'BUG',
		status: 'TODO',
		priority: 'MEDIUM',
		position: 2,
		projectId: 'mock-project-1',
		assigneeId: null,
		dueDate: null,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	{
		id: 'mock-task-4',
		title: 'Покрыть тестами TasksService',
		description: null,
		type: 'TECH_DEBT',
		status: 'BACKLOG',
		priority: 'LOW',
		position: 3,
		projectId: 'mock-project-1',
		assigneeId: null,
		dueDate: null,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	{
		id: 'mock-task-5',
		title: 'Добавить пагинацию в список задач',
		description: null,
		type: 'TASK',
		status: 'IN_REVIEW',
		priority: 'MEDIUM',
		position: 4,
		projectId: 'mock-project-1',
		assigneeId: null,
		dueDate: null,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
]

const applyFilters = (tasks: Task[], projectId: string, params?: TaskFilterParams) =>
	tasks.filter((task) => {
		if (task.projectId !== projectId) return false
		if (params?.status && task.status !== params.status) return false
		if (params?.priority && task.priority !== params.priority) return false
		if (params?.assigneeId && task.assigneeId !== params.assigneeId) return false
		return true
	})

export const tasksService = {
	getAll: async (
		teamId: string,
		projectId: string,
		params?: TaskFilterParams,
	): Promise<PaginatedResponse<Task>> => {
		if (USE_MOCK) {
			const tasks = applyFilters(MOCK_TASKS, projectId, params)
			return {
				data: tasks,
				meta: { page: 1, limit: 20, total: tasks.length, totalPages: 1 },
			}
		}
		const response = await client.get<PaginatedResponse<Task>>(
			buildTasksEndpoint(teamId, projectId),
			{ params },
		)
		return response.data
	},

	getById: async (teamId: string, projectId: string, taskId: string): Promise<Task> => {
		if (USE_MOCK) {
			const task = MOCK_TASKS.find((t) => t.id === taskId)
			if (!task) return Promise.reject(new Error('Task not found'))
			return task
		}
		const response = await client.get<Task>(buildTaskEndpoint(teamId, projectId, taskId))
		return response.data
	},

	create: async (teamId: string, projectId: string, data: CreateTask): Promise<Task> => {
		if (USE_MOCK) {
			const newTask: Task = {
				id: `mock-task-${Date.now()}`,
				title: data.title,
				description: data.description ?? null,
				type: data.type,
				status: data.status ?? 'TODO',
				priority: data.priority ?? 'MEDIUM',
				position: MOCK_TASKS.length + 1,
				projectId,
				assigneeId: data.assigneeId ?? null,
				dueDate: data.dueDate ?? null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}
			MOCK_TASKS.push(newTask)
			return newTask
		}
		const response = await client.post<Task>(buildTasksEndpoint(teamId, projectId), data)
		return response.data
	},

	update: async (
		teamId: string,
		projectId: string,
		taskId: string,
		data: UpdateTask,
	): Promise<Task> => {
		if (USE_MOCK) {
			const index = MOCK_TASKS.findIndex((t) => t.id === taskId)
			const existing = MOCK_TASKS[index]
			if (index === -1 || !existing) return Promise.reject(new Error('Task not found'))
			const updated: Task = {
				...existing,
				...data,
				description:
					data.description !== undefined
						? (data.description ?? null)
						: existing.description,
				updatedAt: new Date().toISOString(),
			}
			MOCK_TASKS[index] = updated
			return updated
		}
		const response = await client.patch<Task>(
			buildTaskEndpoint(teamId, projectId, taskId),
			data,
		)
		return response.data
	},

	delete: async (teamId: string, projectId: string, taskId: string): Promise<void> => {
		if (USE_MOCK) {
			const index = MOCK_TASKS.findIndex((t) => t.id === taskId)
			if (index !== -1) MOCK_TASKS.splice(index, 1)
			return
		}
		await client.delete(buildTaskEndpoint(teamId, projectId, taskId))
	},
}
