import { describe, expect, it } from 'vitest'

import { tasksService } from '@/shared/lib/api/tasks-service'

// tasksService runs in USE_MOCK=true mode: tests cover filtering and CRUD logic.
// All 5 pre-seeded tasks belong to projectId='mock-project-1'.

const TEAM_ID = 'team-1'
const PROJECT_ID = 'mock-project-1'
const UNKNOWN_PROJECT = 'unknown-project'

describe('tasksService (mock mode)', () => {
	describe('getAll', () => {
		it('возвращает задачи только для указанного projectId', async () => {
			const result = await tasksService.getAll(TEAM_ID, PROJECT_ID)

			expect(result.data.length).toBeGreaterThan(0)
			result.data.forEach((task) => {
				expect(task.projectId).toBe(PROJECT_ID)
			})
		})

		it('возвращает пустой список для неизвестного projectId', async () => {
			const result = await tasksService.getAll(TEAM_ID, UNKNOWN_PROJECT)

			expect(result.data).toEqual([])
			expect(result.meta.total).toBe(0)
		})

		it('фильтрует по статусу — возвращает только задачи с нужным status', async () => {
			const result = await tasksService.getAll(TEAM_ID, PROJECT_ID, { status: 'TODO' })

			expect(result.data.length).toBeGreaterThan(0)
			result.data.forEach((task) => {
				expect(task.status).toBe('TODO')
			})
		})

		it('фильтрует по приоритету — возвращает только задачи с нужным priority', async () => {
			const result = await tasksService.getAll(TEAM_ID, PROJECT_ID, {
				priority: 'HIGH',
			})

			expect(result.data.length).toBeGreaterThan(0)
			result.data.forEach((task) => {
				expect(task.priority).toBe('HIGH')
			})
		})

		it('возвращает пустой список, если фильтр не совпадает ни с одной задачей', async () => {
			const result = await tasksService.getAll(TEAM_ID, PROJECT_ID, {
				assigneeId: 'nonexistent-user',
			})

			expect(result.data).toEqual([])
		})

		it('meta содержит корректный total', async () => {
			const result = await tasksService.getAll(TEAM_ID, PROJECT_ID)

			expect(result.meta.total).toBe(result.data.length)
		})
	})

	describe('getById', () => {
		it('возвращает задачу по существующему id', async () => {
			const task = await tasksService.getById(TEAM_ID, PROJECT_ID, 'mock-task-1')

			expect(task.id).toBe('mock-task-1')
			expect(task.type).toBe('EPIC')
		})

		it('отклоняет промис для несуществующего taskId', async () => {
			await expect(
				tasksService.getById(TEAM_ID, PROJECT_ID, 'nonexistent'),
			).rejects.toThrow('Task not found')
		})
	})

	describe('create', () => {
		it('создаёт задачу и возвращает её с присвоенным id', async () => {
			const task = await tasksService.create(TEAM_ID, PROJECT_ID, {
				title: 'New Task',
				type: 'BUG',
			})

			expect(task.id).toBeDefined()
			expect(task.title).toBe('New Task')
			expect(task.type).toBe('BUG')
			expect(task.projectId).toBe(PROJECT_ID)
			expect(task.status).toBe('TODO')
			expect(task.priority).toBe('MEDIUM')
		})

		it('созданная задача появляется в getAll', async () => {
			const created = await tasksService.create(TEAM_ID, PROJECT_ID, {
				title: 'Verifiable Task',
			})

			const list = await tasksService.getAll(TEAM_ID, PROJECT_ID)

			expect(list.data.some((t) => t.id === created.id)).toBe(true)
		})
	})

	describe('update', () => {
		it('обновляет поля задачи и возвращает обновлённый объект', async () => {
			const created = await tasksService.create(TEAM_ID, PROJECT_ID, {
				title: 'Task to update',
			})

			const updated = await tasksService.update(TEAM_ID, PROJECT_ID, created.id, {
				title: 'Updated title',
				status: 'IN_PROGRESS',
			})

			expect(updated.id).toBe(created.id)
			expect(updated.title).toBe('Updated title')
			expect(updated.status).toBe('IN_PROGRESS')
		})

		it('отклоняет промис для несуществующего taskId', async () => {
			await expect(
				tasksService.update(TEAM_ID, PROJECT_ID, 'nonexistent', { title: 'X' }),
			).rejects.toThrow('Task not found')
		})
	})

	describe('delete', () => {
		it('удаляет задачу из списка', async () => {
			const created = await tasksService.create(TEAM_ID, PROJECT_ID, {
				title: 'Task to delete',
			})

			await tasksService.delete(TEAM_ID, PROJECT_ID, created.id)

			const list = await tasksService.getAll(TEAM_ID, PROJECT_ID)

			expect(list.data.some((t) => t.id === created.id)).toBe(false)
		})

		it('не бросает ошибку при удалении несуществующего taskId', async () => {
			await expect(
				tasksService.delete(TEAM_ID, PROJECT_ID, 'nonexistent'),
			).resolves.toBeUndefined()
		})
	})
})
