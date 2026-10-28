import type { Server } from 'http'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { cleanupOpenApiDoc } from 'nestjs-zod'
import request from 'supertest'
import type { Redis } from 'ioredis'
import type { BoardView } from '@repo/types'

import { PrismaService } from '../../prisma/prisma.service'
import { createTestApp, registerAndLogin, resetE2eState } from '../helpers/e2e.helpers'

describe('Tasks (e2e)', () => {
	let app: INestApplication
	let server: Server
	let prisma: PrismaService
	let redisClient: Redis

	// owner создаёт команду, проект и задачи; имеет роль OWNER.
	let ownerCookies: string
	// member принимает приглашение в команду; имеет роль MEMBER.
	let memberCookies: string
	// stranger не состоит в команде.
	let strangerCookies: string

	let teamId: string
	let projectId: string
	let boardId: string

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
		// Задачи удаляются каскадно вместе с проектами и командами.
		await resetE2eState(prisma, redisClient)
		await prisma.project.deleteMany()

		// Регистрируем пользователей.
		const owner = await registerAndLogin(app, 'task-owner@example.com')
		const member = await registerAndLogin(app, 'task-member@example.com')
		const stranger = await registerAndLogin(app, 'task-stranger@example.com')

		ownerCookies = owner.cookies
		memberCookies = member.cookies
		strangerCookies = stranger.cookies

		// Создатель команды автоматически получает роль OWNER.
		const createTeamRes = await request(server)
			.post('/teams/new')
			.set('Cookie', ownerCookies)
			.send({ name: 'Tasks Team' })
			.expect(201)

		teamId = createTeamRes.body.id as string

		// Приглашаем участника и принимаем приглашение.
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

		// Владелец команды создаёт проект.
		const createProjectRes = await request(server)
			.post(`/teams/${teamId}/projects`)
			.set('Cookie', ownerCookies)
			.send({ name: 'Tasks Project', description: 'Project for task tests' })
			.expect(201)

		projectId = createProjectRes.body.id as string
		expect(createProjectRes.body).not.toHaveProperty('boards')
		const boards = await prisma.board.findMany({
			where: { projectId },
			include: { columns: { orderBy: { position: 'asc' } } },
		})
		expect(boards).toHaveLength(1)
		boardId = boards[0].id
		expect(boards[0].isDefault).toBe(true)
		expect(boards[0].columns.map((column) => column.key)).toEqual([
			'TODO',
			'IN_PROGRESS',
			'IN_REVIEW',
			'DONE',
		])
	})
	// Создаём задачу через API.
	async function createTask(cookies: string, overrides: Record<string, unknown> = {}) {
		const res = await request(server)
			.post(`/teams/${teamId}/projects/${projectId}/tasks`)
			.set('Cookie', cookies)
			.send({ title: 'Fix login bug', ...overrides })
			.expect(201)

		expect(res.body).not.toHaveProperty('boardColumnId')
		const stored = await prisma.task.findUniqueOrThrow({
			where: { id: res.body.id as string },
			include: { boardColumn: { include: { board: true } } },
		})
		expect(stored.boardColumn).toMatchObject({
			projectId,
			key: stored.status,
			isSystem: true,
			board: { isDefault: true },
		})

		return res.body as {
			id: string
			title: string
			description: string | null
			status: string
			priority: string
			type: string
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
			type: expect.any(String),
			position: expect.any(Number),
			projectId,
			createdById: expect.any(String),
			createdAt: expect.any(String),
			updatedAt: expect.any(String),
			...overrides,
		})
		expect(task).toHaveProperty('description')
		expect(task).not.toHaveProperty('boardColumnId')
	}

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

	describe('GET /teams/:teamId/projects/:projectId/tasks', () => {
		it('publishes the list query contract and task type in Swagger', () => {
			const document = cleanupOpenApiDoc(
				SwaggerModule.createDocument(
					app,
					new DocumentBuilder().setTitle('Tasks').setVersion('1').build(),
				),
			)
			const parameters =
				document.paths['/teams/{teamId}/projects/{projectId}/tasks'].get?.parameters
			for (const [name, schema] of [
				['type', { enum: ['EPIC', 'STORY', 'BUG', 'TECH_DEBT', 'TASK'] }],
				['search', { type: 'string', maxLength: 255 }],
				['sortBy', { enum: ['createdAt', 'priority', 'status'], default: 'createdAt' }],
				['sortOrder', { enum: ['asc', 'desc'], default: 'desc' }],
			] as const) {
				expect(parameters).toContainEqual(
					expect.objectContaining({
						name,
						in: 'query',
						required: false,
						schema: expect.objectContaining(schema),
					}),
				)
			}
			expect(document.components?.schemas?.TaskResponseDto).toMatchObject({
				required: expect.arrayContaining(['type']),
				properties: { type: { enum: ['EPIC', 'STORY', 'BUG', 'TECH_DEBT', 'TASK'] } },
			})
		})

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
			// Создаём задачи с разными статусами.
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

		it('stores task types, returns TASK by default and applies type changes to filtering', async () => {
			const standard = await createTask(ownerCookies)
			expect(standard.type).toBe('TASK')
			const typed = await createTask(ownerCookies, { title: 'Typed task', type: 'BUG' })
			expect(typed.type).toBe('BUG')
			const updated = await request(server)
				.patch(`/teams/${teamId}/projects/${projectId}/tasks/${typed.id}`)
				.set('Cookie', ownerCookies)
				.send({ type: 'STORY' })
				.expect(200)
			expect(updated.body).toMatchObject({ type: 'STORY', version: 1 })
			for (const [type, ids] of [
				['TASK', [standard.id]],
				['BUG', []],
				['STORY', [typed.id]],
			] as const) {
				const response = await request(server)
					.get(`/teams/${teamId}/projects/${projectId}/tasks`)
					.set('Cookie', ownerCookies)
					.query({ type })
					.expect(200)
				expect(response.body.data.map((task: { id: string }) => task.id)).toEqual(ids)
				expect(response.body.meta.total).toBe(ids.length)
			}
		})

		it('supports all task types stored in PostgreSQL', async () => {
			for (const type of ['EPIC', 'STORY', 'BUG', 'TECH_DEBT', 'TASK']) {
				await createTask(ownerCookies, { title: type, type })
			}
			for (const type of ['EPIC', 'STORY', 'BUG', 'TECH_DEBT', 'TASK']) {
				const response = await request(server)
					.get(`/teams/${teamId}/projects/${projectId}/tasks`)
					.set('Cookie', ownerCookies)
					.query({ type })
					.expect(200)
				expect(response.body.data).toHaveLength(1)
				expect(response.body.data[0]).toMatchObject({ type, title: type })
			}
		})

		it('combines search with type, status, priority and assignee before counting and pagination', async () => {
			const { createdById: assigneeId } = await prisma.project.findUniqueOrThrow({
				where: { id: projectId },
			})
			const filters = { type: 'BUG', status: 'IN_PROGRESS', priority: 'HIGH', assigneeId }
			const match = await createTask(ownerCookies, {
				title: 'Fix LoGiN issue',
				...filters,
			})
			await createTask(ownerCookies, { title: 'Login task', ...filters, type: 'TASK' })
			await createTask(ownerCookies, { title: 'Login done', ...filters, status: 'DONE' })
			await createTask(ownerCookies, { title: 'Login low', ...filters, priority: 'LOW' })
			await createTask(ownerCookies, {
				title: 'Login unassigned',
				...filters,
				assigneeId: undefined,
			})
			await createTask(ownerCookies, {
				title: 'Other issue',
				description: 'login',
				...filters,
			})
			const first = await request(server)
				.get(`/teams/${teamId}/projects/${projectId}/tasks`)
				.set('Cookie', ownerCookies)
				.query({ ...filters, search: '  login  ', limit: 1 })
				.expect(200)
			expect(first.body.data.map((task: { id: string }) => task.id)).toEqual([match.id])
			expect(first.body.meta).toEqual({ page: 1, limit: 1, total: 1, totalPages: 1 })
			const next = await request(server)
				.get(`/teams/${teamId}/projects/${projectId}/tasks`)
				.set('Cookie', ownerCookies)
				.query({ ...filters, search: 'login', limit: 1, page: 2 })
				.expect(200)
			expect(next.body.data).toEqual([])
			expect(next.body.meta.total).toBe(1)
		})

		it('restricts search and counts to the requested project', async () => {
			const match = await createTask(ownerCookies, { title: 'Find this item' })
			const other = await request(server)
				.post(`/teams/${teamId}/projects`)
				.set('Cookie', ownerCookies)
				.send({ name: 'Other project' })
				.expect(201)
			await request(server)
				.post(`/teams/${teamId}/projects/${other.body.id}/tasks`)
				.set('Cookie', ownerCookies)
				.send({ title: 'Find this item' })
				.expect(201)
			const response = await request(server)
				.get(`/teams/${teamId}/projects/${projectId}/tasks`)
				.set('Cookie', ownerCookies)
				.query({ search: 'find this' })
				.expect(200)
			expect(response.body.data.map((task: { id: string }) => task.id)).toEqual([
				match.id,
			])
			expect(response.body.meta.total).toBe(1)
		})

		it.each([
			['100%', 'Progress 100% ready', 'Progress 1000 ready'],
			['under_score', 'under_score fix', 'underXscore fix'],
			['C:\\work', 'C:\\work fix', 'C:work fix'],
			['поиск', 'Проверить ПоИсК', 'Other task'],
		])(
			'searches for the literal case-insensitive substring %s',
			async (search, title, otherTitle) => {
				const match = await createTask(ownerCookies, { title })
				await createTask(ownerCookies, { title: otherTitle })
				const response = await request(server)
					.get(`/teams/${teamId}/projects/${projectId}/tasks`)
					.set('Cookie', ownerCookies)
					.query({ search })
					.expect(200)
				expect(response.body.data.map((task: { id: string }) => task.id)).toEqual([
					match.id,
				])
				expect(response.body.meta.total).toBe(1)
			},
		)

		it('does not filter on an empty or whitespace-only search', async () => {
			await createTask(ownerCookies)
			for (const search of ['', '   ']) {
				const response = await request(server)
					.get(`/teams/${teamId}/projects/${projectId}/tasks`)
					.set('Cookie', ownerCookies)
					.query({ search })
					.expect(200)
				expect(response.body.data).toHaveLength(1)
				expect(response.body.meta.total).toBe(1)
			}
		})

		it.each([
			{ sortBy: 'createdAt', sortOrder: 'asc', indices: [1, 3, 0, 2] },
			{ sortBy: 'createdAt', sortOrder: 'desc', indices: [2, 0, 3, 1] },
			{ sortBy: 'priority', sortOrder: 'asc', indices: [2, 0, 3, 1] },
			{ sortBy: 'priority', sortOrder: 'desc', indices: [1, 3, 0, 2] },
			{ sortBy: 'status', sortOrder: 'asc', indices: [1, 3, 0, 2] },
			{ sortBy: 'status', sortOrder: 'desc', indices: [2, 0, 3, 1] },
		])(
			'sorts by $sortBy $sortOrder using date/enum order',
			async ({ sortBy, sortOrder, indices }) => {
				const priorities = ['MEDIUM', 'CRITICAL', 'LOW', 'HIGH']
				const statuses = ['IN_REVIEW', 'TODO', 'DONE', 'IN_PROGRESS']
				const days = [3, 1, 4, 2]
				const ids: string[] = []
				for (let i = 0; i < 4; i++) {
					const task = await createTask(ownerCookies, {
						title: `Sort ${i}`,
						priority: priorities[i],
						status: statuses[i],
					})
					await prisma.task.update({
						where: { id: task.id },
						data: { createdAt: new Date(`2026-01-0${days[i]}T00:00:00Z`) },
					})
					ids.push(task.id)
				}
				const response = await request(server)
					.get(`/teams/${teamId}/projects/${projectId}/tasks`)
					.set('Cookie', ownerCookies)
					.query({ sortBy, sortOrder })
					.expect(200)
				expect(response.body.data.map((task: { id: string }) => task.id)).toEqual(
					indices.map((i) => ids[i]),
				)
			},
		)

		it('uses an ID tie-breaker for stable default ordering and pagination', async () => {
			const column = await prisma.boardColumn.findFirstOrThrow({
				where: { projectId, key: 'TODO' },
			})
			const { createdById } = await prisma.project.findUniqueOrThrow({
				where: { id: projectId },
			})
			const ids = [1, 2, 3, 4, 5].map((i) => `00000000-0000-4000-8000-00000000000${i}`)
			await prisma.task.createMany({
				data: ids.map((id, position) => ({
					id,
					title: id,
					projectId,
					createdById,
					boardColumnId: column.id,
					position,
					createdAt: new Date('2026-01-01T00:00:00Z'),
				})),
			})
			const pages: string[] = []
			for (const page of [1, 2, 3]) {
				const response = await request(server)
					.get(`/teams/${teamId}/projects/${projectId}/tasks`)
					.set('Cookie', ownerCookies)
					.query({ page, limit: 2 })
					.expect(200)
				pages.push(...(response.body.data as { id: string }[]).map((task) => task.id))
				expect(response.body.meta.total).toBe(5)
			}
			expect(pages).toEqual([...ids].reverse())
			const ascending = await request(server)
				.get(`/teams/${teamId}/projects/${projectId}/tasks`)
				.set('Cookie', ownerCookies)
				.query({ sortOrder: 'asc' })
				.expect(200)
			expect(ascending.body.data.map((task: { id: string }) => task.id)).toEqual(ids)
		})

		it.each([
			{ type: 'UNKNOWN' },
			{ search: 'x'.repeat(256) },
			{ sortBy: 'title' },
			{ sortBy: 'createdAt; DROP TABLE Task' },
			{ sortOrder: 'DESC' },
			{ sortOrder: 'sideways' },
		])('returns 400 for invalid query %j', async (query) => {
			await request(server)
				.get(`/teams/${teamId}/projects/${projectId}/tasks`)
				.set('Cookie', ownerCookies)
				.query(query)
				.expect(400)
		})
	})

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

	describe('PATCH /teams/:teamId/projects/:projectId/tasks/:taskId', () => {
		it('200 — синхронизирует колонку со статусом при обычном PATCH', async () => {
			const task = await createTask(ownerCookies)
			for (const status of ['IN_PROGRESS', 'IN_REVIEW', 'DONE', 'TODO']) {
				const response = await request(server)
					.patch(`/teams/${teamId}/projects/${projectId}/tasks/${task.id}`)
					.set('Cookie', ownerCookies)
					.send({ status })
					.expect(200)
				expectTaskShape(response.body as Record<string, unknown>, { status })
				const stored = await prisma.task.findUniqueOrThrow({
					where: { id: task.id },
					include: { boardColumn: true },
				})
				expect(stored.boardColumn).toMatchObject({
					projectId,
					key: status,
					isSystem: true,
				})
			}
		})

		it('200 — создатель задачи (MEMBER) может обновить свою задачу', async () => {
			// Участник создаёт задачу и становится её автором.
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
			// Участник создаёт задачу.
			const task = await createTask(memberCookies, { title: 'Member task' })

			const res = await request(server)
				.patch(`/teams/${teamId}/projects/${projectId}/tasks/${task.id}`)
				.set('Cookie', ownerCookies)
				.send({ title: 'Updated by owner' })
				.expect(200)

			expect(res.body.title).toBe('Updated by owner')
		})

		it('403 — MEMBER не может обновить чужую задачу', async () => {
			// Владелец создаёт задачу; участник не является её автором.
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

	describe('Board', () => {
		it('200 — участник получает доску: 4 колонки, задачи распределены по статусам', async () => {
			await createTask(ownerCookies, { title: 'Todo task', status: 'TODO' })
			await createTask(ownerCookies, { title: 'In-progress task', status: 'IN_PROGRESS' })

			const res = await request(server)
				.get(`/teams/${teamId}/projects/${projectId}/tasks/board`)
				.query({ boardId })
				.set('Cookie', memberCookies)
				.expect(200)

			const result = res.body as BoardView
			const columns = result.columns

			expect(result.board.id).toBe(boardId)
			expect(columns).toHaveLength(4)

			const statuses = columns.map((c) => c.key)
			expect(statuses).toEqual(
				expect.arrayContaining(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
			)

			const todoColumn = columns.find((c) => c.key === 'TODO')!
			expect(todoColumn.tasks).toHaveLength(1)
			expect(todoColumn.tasks[0]).toMatchObject({ title: 'Todo task' })

			const inProgressColumn = columns.find((c) => c.key === 'IN_PROGRESS')!
			expect(inProgressColumn.tasks).toHaveLength(1)

			const emptyStatuses = columns.filter(
				(c) => !['TODO', 'IN_PROGRESS'].includes(c.key),
			)
			emptyStatuses.forEach((col) => expect(col.tasks).toHaveLength(0))
		})

		it('403 — незнакомец не может получить доску', async () => {
			await request(server)
				.get(`/teams/${teamId}/projects/${projectId}/tasks/board`)
				.query({ boardId })
				.set('Cookie', strangerCookies)
				.expect(403)
		})

		it('200 — PATCH /:taskId/move перемещает задачу в новый статус и позицию', async () => {
			const task = await createTask(ownerCookies, {
				title: 'Movable task',
				status: 'TODO',
			})
			const boardColumns = await prisma.boardColumn.findMany({ where: { boardId } })
			const fromColumnId = boardColumns.find((column) => column.key === 'TODO')!.id
			const toColumnId = boardColumns.find((column) => column.key === 'IN_PROGRESS')!.id

			const res = await request(server)
				.patch(`/teams/${teamId}/projects/${projectId}/tasks/${task.id}/move`)
				.set('Cookie', memberCookies)
				.send({ fromColumnId, toColumnId, position: 0, expectedVersion: 0 })
				.expect(200)

			expect(res.body.status).toBe('IN_PROGRESS')
			expect(res.body.position).toBe(0)
			expect(res.body.boardColumnId).toBe(toColumnId)
			expect(res.body.version).toBe(1)
			const stored = await prisma.task.findUniqueOrThrow({
				where: { id: task.id },
				include: { boardColumn: true },
			})
			expect(stored.boardColumn).toMatchObject({
				projectId,
				key: 'IN_PROGRESS',
				isSystem: true,
			})

			// Подтверждаем через доску
			const boardRes = await request(server)
				.get(`/teams/${teamId}/projects/${projectId}/tasks/board`)
				.query({ boardId })
				.set('Cookie', memberCookies)
				.expect(200)

			const columns = (boardRes.body as BoardView).columns
			const inProgressTasks = columns.find((c) => c.key === 'IN_PROGRESS')!.tasks
			expect(inProgressTasks.some((t) => t.id === task.id)).toBe(true)
		})

		it('400 — PATCH /:taskId/move с невалидным статусом возвращает Bad Request', async () => {
			const task = await createTask(ownerCookies, { title: 'Task for invalid move' })

			await request(server)
				.patch(`/teams/${teamId}/projects/${projectId}/tasks/${task.id}/move`)
				.set('Cookie', ownerCookies)
				.send({ status: 'INVALID_STATUS', position: 0 })
				.expect(400)
		})
	})

	describe('DELETE /teams/:teamId/projects/:projectId/tasks/:taskId', () => {
		it('204 — OWNER может удалить задачу', async () => {
			const task = await createTask(ownerCookies, { title: 'Task to delete' })

			await request(server)
				.delete(`/teams/${teamId}/projects/${projectId}/tasks/${task.id}`)
				.set('Cookie', ownerCookies)
				.expect(204)

			// Проверяем, что задача удалена.
			await request(server)
				.get(`/teams/${teamId}/projects/${projectId}/tasks/${task.id}`)
				.set('Cookie', ownerCookies)
				.expect(404)
		})

		it('403 — MEMBER не может удалить задачу (даже свою)', async () => {
			// Авторство задачи не даёт права на удаление: оно доступно только OWNER и ADMIN.
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
