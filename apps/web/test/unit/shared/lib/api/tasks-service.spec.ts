import '@/test/mocks/api/http-client.mock'

import { mockApiClient, resetApiClientMock } from '@/test/mocks/api/http-client.mock'
import { createTaskFixture } from '@/test/mocks/api/tasks.fixtures'
import { axiosResponse } from '@/test/mocks/api/team-api.fixtures'
import { beforeEach, describe, expect, it } from 'vitest'

import { tasksService } from '@/shared/lib/api/tasks-service'

describe('tasksService', () => {
	beforeEach(() => {
		resetApiClientMock()
	})

	describe('getAll', () => {
		it('запрашивает список задач с нужным endpoint и params', async () => {
			const tasks = [
				createTaskFixture({ id: 'task-1' }),
				createTaskFixture({ id: 'task-2' }),
			]
			const paginatedResponse = {
				data: tasks,
				meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
			}
			mockApiClient.get.mockResolvedValue(axiosResponse(paginatedResponse))

			const result = await tasksService.getAll('team-1', 'project-1')

			expect(mockApiClient.get).toHaveBeenCalledWith(
				'/teams/team-1/projects/project-1/tasks',
				{ params: undefined },
			)
			expect(result).toEqual(paginatedResponse)
		})

		it('передаёт параметры фильтрации в запрос', async () => {
			mockApiClient.get.mockResolvedValue(
				axiosResponse({
					data: [],
					meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
				}),
			)

			await tasksService.getAll('team-1', 'project-1', {
				status: 'TODO',
				priority: 'HIGH',
			})

			expect(mockApiClient.get).toHaveBeenCalledWith(
				'/teams/team-1/projects/project-1/tasks',
				{ params: { status: 'TODO', priority: 'HIGH' } },
			)
		})
	})

	describe('getById', () => {
		it('запрашивает задачу по правильному endpoint', async () => {
			const task = createTaskFixture({ id: 'task-1' })
			mockApiClient.get.mockResolvedValue(axiosResponse(task))

			const result = await tasksService.getById('team-1', 'project-1', 'task-1')

			expect(mockApiClient.get).toHaveBeenCalledWith(
				'/teams/team-1/projects/project-1/tasks/task-1',
			)
			expect(result).toEqual(task)
		})
	})

	describe('create', () => {
		it('отправляет POST с данными и возвращает созданную задачу', async () => {
			const task = createTaskFixture({ id: 'task-new', title: 'New Task', type: 'BUG' })
			mockApiClient.post.mockResolvedValue(axiosResponse(task))

			const result = await tasksService.create('team-1', 'project-1', {
				title: 'New Task',
				type: 'BUG',
			})

			expect(mockApiClient.post).toHaveBeenCalledWith(
				'/teams/team-1/projects/project-1/tasks',
				{ title: 'New Task', type: 'BUG' },
			)
			expect(result).toEqual(task)
		})
	})

	describe('update', () => {
		it('отправляет PATCH с данными и возвращает обновлённую задачу', async () => {
			const task = createTaskFixture({ id: 'task-1', title: 'Updated', status: 'DONE' })
			mockApiClient.patch.mockResolvedValue(axiosResponse(task))

			const result = await tasksService.update('team-1', 'project-1', 'task-1', {
				title: 'Updated',
				status: 'DONE',
			})

			expect(mockApiClient.patch).toHaveBeenCalledWith(
				'/teams/team-1/projects/project-1/tasks/task-1',
				{ title: 'Updated', status: 'DONE' },
			)
			expect(result).toEqual(task)
		})
	})

	describe('delete', () => {
		it('отправляет DELETE на правильный endpoint', async () => {
			mockApiClient.delete.mockResolvedValue(axiosResponse(undefined))

			await tasksService.delete('team-1', 'project-1', 'task-1')

			expect(mockApiClient.delete).toHaveBeenCalledWith(
				'/teams/team-1/projects/project-1/tasks/task-1',
			)
		})
	})
})
