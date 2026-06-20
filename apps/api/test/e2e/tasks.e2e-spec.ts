import type { Server } from 'http'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import type { Redis } from 'ioredis'

import { PrismaService } from '../../prisma/prisma.service'
import { createTestApp, registerAndLogin, resetE2eState } from '../helpers/e2e.helpers'

describe('Tasks (e2e)', () => {
	let app: INestApplication
	let server: Server
	let prisma: PrismaService
	let redisClient: Redis

	// owner — creates team, project and tasks; has OWNER role
	let ownerCookies: string
	// member — invited/joined team; has MEMBER role
	let memberCookies: string
	// stranger — not in the team at all
	let strangerCookies: string

	let teamId: string
	let projectId: string

	beforeAll(async () => {
		const testApp = await createTestApp()
		app = testApp.app
		server = app.getHttpServer() as Server
		prisma = testApp.prisma
		redisClient = testApp.redisClient
	})

	afterAll(async () => {
		await redisClient.flushall()
		await prisma.$disconnect()
		await app.close()
	})

	beforeEach(async () => {
		// Clean up all related data (tasks are cascade-deleted with projects/teams)
		await resetE2eState(prisma, redisClient)
		await prisma.project.deleteMany()

		// Register users
		const owner = await registerAndLogin(app, 'task-owner@example.com')
		const member = await registerAndLogin(app, 'task-member@example.com')
		const stranger = await registerAndLogin(app, 'task-stranger@example.com')

		ownerCookies = owner.cookies
		memberCookies = member.cookies
		strangerCookies = stranger.cookies

		// Create team (owner automatically becomes OWNER member)
		const createTeamRes = await request(server)
			.post('/teams/new')
			.set('Cookie', ownerCookies)
			.send({ name: 'Tasks Team' })
			.expect(201)

		teamId = createTeamRes.body.id as string

		// Invite and accept member into team
		const inviteRes = await request(server)
			.post(`/teams/${teamId}/invitations`)
			.set('Cookie', ownerCookies)
			.send({ email: 'task-member@example.com', role: 'MEMBER' })
			.expect(201)

		const inviteToken = inviteRes.body.token as string

		await request(server)
			.post(`/invitations/${inviteToken}/accept`)
			.set('Cookie', memberCookies)
			.expect(200)

		// Create project (owner creates it)
		const createProjectRes = await request(server)
			.post(`/teams/${teamId}/projects`)
			.set('Cookie', ownerCookies)
			.send({ name: 'Tasks Project', description: 'Project for task tests' })
			.expect(201)

		projectId = createProjectRes.body.id as string
	})

	// ─────────────────────────────────────────────────────────────────────────
	// Helper to create a task via the API
	// ─────────────────────────────────────────────────────────────────────────
	async function createTask(cookies: string, overrides: Record<string, unknown> = {}) {
		const res = await request(server)
			.post(`/teams/${teamId}/projects/${projectId}/tasks`)
			.set('Cookie', cookies)
			.send({ title: 'Fix login bug', ...overrides })
			.expect(201)

		return res.body as {
			id: string
			title: string
			description: string | null
			status: string
			priority: string
			position: number
			projectId: string
			createdById: string
			createdAt: string
			updatedAt: string
		}
	}

	function expectTaskShape(
		task: Record<string, unknown>,
		overrides: Record<string, unknown> = {},
	) {
		expect(task).toMatchObject({
			id: expect.any(String),
			title: expect.any(String),
			status: expect.any(String),
			priority: expect.any(String),
			position: expect.any(Number),
			projectId,
			createdById: expect.any(String),
			createdAt: expect.any(String),
			updatedAt: expect.any(String),
			...overrides,
		})
		expect(task).toHaveProperty('description')
	}

	// ── POST /teams/:teamId/projects/:projectId/tasks ─────────────────────────

	describe('POST /teams/:teamId/projects/:projectId/tasks', () => {
		it('201 — участник команды (MEMBER) создаёт задачу и получает объект задачи', async () => {
			const res = await request(server)
				.post(`/teams/${teamId}/projects/${projectId}/tasks`)
				.set('Cookie', memberCookies)
				.send({ title: 'Fix login bug' })
				.expect(201)

			const body = res.body as Record<string, unknown>

			expectTaskShape(body, {
				title: 'Fix login bug',
				status: 'TODO',
				priority: 'MEDIUM',
				position: 1,
				projectId,
			})
		})

		it('201 — владелец команды (OWNER) создаёт задачу', async () => {
			const task = await createTask(ownerCookies, { title: 'Owner task' })
			expectTaskShape(task, { title: 'Owner task' })
		})

		it('403 — пользователь, не входящий в команду (STRANGER), получает Forbidden', async () => {
			await request(server)
				.post(`/teams/${teamId}/projects/${projectId}/tasks`)
				.set('Cookie', strangerCookies)
				.send({ title: 'Forbidden task' })
				.expect(403)
		})

		it('position автоинкрементируется для задач с одинаковым статусом', async () => {
			const task1 = await createTask(ownerCookies, { title: 'Task 1' })
			const task2 = await createTask(ownerCookies, { title: 'Task 2' })

			expect(task1.position).toBe(1)
			expect(task2.position).toBe(2)
		})

		it('400 — отсутствует обязательное поле title', async () => {
			await request(server)
				.post(`/teams/${teamId}/projects/${projectId}/tasks`)
				.set('Cookie', ownerCookies)
				.send({})
				.expect(400)
		})

		it('400 — title пустая строка', async () => {
			await request(server)
				.post(`/teams/${teamId}/projects/${projectId}/tasks`)
				.set('Cookie', ownerCookies)
				.send({ title: '' })
				.expect(400)
		})

		it('400 — невалидный enum status', async () => {
			await request(server)
				.post(`/teams/${teamId}/projects/${projectId}/tasks`)
				.set('Cookie', ownerCookies)
				.send({ title: 'Valid title', status: 'INVALID_STATUS' })
				.expect(400)
		})

		it('400 — невалидный enum priority', async () => {
			await request(server)
				.post(`/teams/${teamId}/projects/${projectId}/tasks`)
				.set('Cookie', ownerCookies)
				.send({ title: 'Valid title', priority: 'SUPER_HIGH' })
				.expect(400)
		})

		it('400 — dueDate не в формате ISO 8601', async () => {
			await request(server)
				.post(`/teams/${teamId}/projects/${projectId}/tasks`)
				.set('Cookie', ownerCookies)
				.send({ title: 'Valid title', dueDate: 'not-a-date' })
				.expect(400)
		})
	})

	// ── GET /teams/:teamId/projects/:projectId/tasks ──────────────────────────

	describe('GET /teams/:teamId/projects/:projectId/tasks', () => {
		it('200 — возвращает пагинированный список задач', async () => {
			await createTask(ownerCookies, { title: 'Task A' })
			await createTask(ownerCookies, { title: 'Task B' })

			const res = await request(server)
				.get(`/teams/${teamId}/projects/${projectId}/tasks?page=1&limit=1`)
				.set('Cookie', ownerCookies)
				.expect(200)

			expect(res.body.meta).toEqual({
				page: 1,
				limit: 1,
				total: 2,
				totalPages: 2,
			})
			expect(res.body.data).toHaveLength(1)
		})

		it('200 — фильтрация по status=IN_PROGRESS возвращает только задачи с нужным статусом', async () => {
			// Create tasks with different statuses
			await createTask(ownerCookies, { title: 'TODO task', status: 'TODO' })
			await createTask(ownerCookies, { title: 'In-progress task', status: 'IN_PROGRESS' })
			await createTask(ownerCookies, {
				title: 'Another in-progress',
				status: 'IN_PROGRESS',
			})

			const res = await request(server)
				.get(`/teams/${teamId}/projects/${projectId}/tasks?status=IN_PROGRESS`)
				.set('Cookie', ownerCookies)
				.expect(200)

			const data = res.body.data as Record<string, unknown>[]
			expect(data.length).toBe(2)
			data.forEach((task) => {
				expect(task.status).toBe('IN_PROGRESS')
			})
		})

		it('403 — незнакомец не может получить список задач', async () => {
			await request(server)
				.get(`/teams/${teamId}/projects/${projectId}/tasks`)
				.set('Cookie', strangerCookies)
				.expect(403)
		})
	})

	// ── GET /teams/:teamId/projects/:projectId/tasks/:taskId ──────────────────

	describe('GET /teams/:teamId/projects/:projectId/tasks/:taskId', () => {
		it('200 — возвращает существующую задачу', async () => {
			const task = await createTask(ownerCookies, { title: 'Existing task' })

			const res = await request(server)
				.get(`/teams/${teamId}/projects/${projectId}/tasks/${task.id}`)
				.set('Cookie', ownerCookies)
				.expect(200)

			const body = res.body as Record<string, unknown>

			expectTaskShape(body, {
				id: task.id,
				title: 'Existing task',
				projectId,
			})
		})

		it('404 — несуществующий taskId возвращает Not Found', async () => {
			await request(server)
				.get(`/teams/${teamId}/projects/${projectId}/tasks/non-existent-task-id`)
				.set('Cookie', ownerCookies)
				.expect(404)
		})

		it('403 — незнакомец не может получить задачу', async () => {
			const task = await createTask(ownerCookies, { title: 'Secret task' })

			await request(server)
				.get(`/teams/${teamId}/projects/${projectId}/tasks/${task.id}`)
				.set('Cookie', strangerCookies)
				.expect(403)
		})
	})

	// ── PATCH /teams/:teamId/projects/:projectId/tasks/:taskId ────────────────

	describe('PATCH /teams/:teamId/projects/:projectId/tasks/:taskId', () => {
		it('200 — создатель задачи (MEMBER) может обновить свою задачу', async () => {
			// Member creates a task — they are the creator
			const task = await createTask(memberCookies, { title: 'Member task' })

			const res = await request(server)
				.patch(`/teams/${teamId}/projects/${projectId}/tasks/${task.id}`)
				.set('Cookie', memberCookies)
				.send({ title: 'Updated by member', status: 'IN_PROGRESS' })
				.expect(200)

			const body = res.body as Record<string, unknown>

			expectTaskShape(body, {
				id: task.id,
				title: 'Updated by member',
				status: 'IN_PROGRESS',
			})
		})

		it('200 — OWNER может обновить чужую задачу', async () => {
			// Member creates the task
			const task = await createTask(memberCookies, { title: 'Member task' })

			const res = await request(server)
				.patch(`/teams/${teamId}/projects/${projectId}/tasks/${task.id}`)
				.set('Cookie', ownerCookies)
				.send({ title: 'Updated by owner' })
				.expect(200)

			expect(res.body.title).toBe('Updated by owner')
		})

		it('403 — MEMBER не может обновить чужую задачу', async () => {
			// Owner creates the task — member is NOT the creator
			const task = await createTask(ownerCookies, { title: 'Owner task' })

			await request(server)
				.patch(`/teams/${teamId}/projects/${projectId}/tasks/${task.id}`)
				.set('Cookie', memberCookies)
				.send({ title: 'Hacked title' })
				.expect(403)
		})

		it('404 — обновление несуществующей задачи возвращает Not Found', async () => {
			await request(server)
				.patch(`/teams/${teamId}/projects/${projectId}/tasks/non-existent-id`)
				.set('Cookie', ownerCookies)
				.send({ title: 'Ghost update' })
				.expect(404)
		})

		it('400 — невалидный enum status при обновлении', async () => {
			const task = await createTask(ownerCookies, { title: 'Task to patch' })

			await request(server)
				.patch(`/teams/${teamId}/projects/${projectId}/tasks/${task.id}`)
				.set('Cookie', ownerCookies)
				.send({ status: 'WRONG_STATUS' })
				.expect(400)
		})
	})

	// ── DELETE /teams/:teamId/projects/:projectId/tasks/:taskId ──────────────

	describe('DELETE /teams/:teamId/projects/:projectId/tasks/:taskId', () => {
		it('200 — OWNER может удалить задачу', async () => {
			const task = await createTask(ownerCookies, { title: 'Task to delete' })

			const res = await request(server)
				.delete(`/teams/${teamId}/projects/${projectId}/tasks/${task.id}`)
				.set('Cookie', ownerCookies)
				.expect(200)

			expect(res.body).toMatchObject({ success: true })

			// Verify it's gone
			await request(server)
				.get(`/teams/${teamId}/projects/${projectId}/tasks/${task.id}`)
				.set('Cookie', ownerCookies)
				.expect(404)
		})

		it('403 — MEMBER не может удалить задачу (даже свою)', async () => {
			// Member creates a task but still cannot delete it (only OWNER/ADMIN can)
			const task = await createTask(memberCookies, { title: 'Member task to delete' })

			await request(server)
				.delete(`/teams/${teamId}/projects/${projectId}/tasks/${task.id}`)
				.set('Cookie', memberCookies)
				.expect(403)
		})

		it('403 — незнакомец не может удалить задачу', async () => {
			const task = await createTask(ownerCookies, { title: 'Protected task' })

			await request(server)
				.delete(`/teams/${teamId}/projects/${projectId}/tasks/${task.id}`)
				.set('Cookie', strangerCookies)
				.expect(403)
		})

		it('404 — удаление несуществующей задачи возвращает Not Found', async () => {
			await request(server)
				.delete(`/teams/${teamId}/projects/${projectId}/tasks/non-existent-id`)
				.set('Cookie', ownerCookies)
				.expect(404)
		})
	})
})
