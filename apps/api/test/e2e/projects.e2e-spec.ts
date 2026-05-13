import type { Server } from 'http'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import type { Redis } from 'ioredis'

import { PrismaService } from '../../prisma/prisma.service'
import { createTestApp, registerAndLogin, resetE2eState } from '../helpers/e2e.helpers'

describe('Projects (e2e)', () => {
	let app: INestApplication
	let server: Server
	let prisma: PrismaService
	let redisClient: Redis

	let ownerCookies: string
	let outsiderCookies: string
	let teamId: string

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
		await resetE2eState(prisma, redisClient)
		await prisma.project.deleteMany()

		const owner = await registerAndLogin(app, 'project-owner@example.com')
		const outsider = await registerAndLogin(app, 'project-outsider@example.com')

		ownerCookies = owner.cookies
		outsiderCookies = outsider.cookies

		const createTeamRes = await request(server)
			.post('/teams/new')
			.set('Cookie', ownerCookies)
			.send({ name: 'Projects Team' })
			.expect(201)

		teamId = createTeamRes.body.id as string
	})

	async function createProject(
		name = 'Backend Rewrite',
		description = 'NestJS API rewrite',
	) {
		const res = await request(server)
			.post(`/teams/${teamId}/projects`)
			.set('Cookie', ownerCookies)
			.send({ name, description })
			.expect(201)

		return res.body as {
			id: string
			name: string
			description: string | null
			teamId: string
			createdById: string
			createdAt: string
			updatedAt: string
		}
	}

	function expectProjectResponse(
		project: Record<string, unknown>,
		overrides: Record<string, unknown> = {},
	) {
		expect(project).toMatchObject({
			id: expect.any(String),
			name: expect.any(String),
			teamId: expect.any(String),
			createdById: expect.any(String),
			createdAt: expect.any(String),
			updatedAt: expect.any(String),
			...overrides,
		})
		expect(project).toHaveProperty('description')
	}

	describe('POST /teams/:teamId/projects', () => {
		it('создаёт проект и возвращает ProjectResponseDto', async () => {
			const res = await request(server)
				.post(`/teams/${teamId}/projects`)
				.set('Cookie', ownerCookies)
				.send({ name: 'Backend Rewrite', description: 'NestJS API rewrite' })
				.expect(201)

			const body = res.body as Record<string, unknown>

			expectProjectResponse(body, {
				name: 'Backend Rewrite',
				description: 'NestJS API rewrite',
				teamId,
			})
		})

		it('403 — пользователь не из команды не может создать проект', async () => {
			await request(server)
				.post(`/teams/${teamId}/projects`)
				.set('Cookie', outsiderCookies)
				.send({ name: 'Forbidden Project' })
				.expect(403)
		})
	})

	describe('GET /teams/:teamId/projects', () => {
		it('возвращает список проектов с пагинацией', async () => {
			await createProject('Backend Rewrite')
			await createProject('Frontend Refresh')

			const res = await request(server)
				.get(`/teams/${teamId}/projects?page=1&limit=1`)
				.set('Cookie', ownerCookies)
				.expect(200)

			expect(res.body.meta).toEqual({
				page: 1,
				limit: 1,
				total: 2,
				totalPages: 2,
			})
			expect(res.body.data).toHaveLength(1)

			const data = res.body.data as Record<string, unknown>[]
			expectProjectResponse(data[0], { teamId })
		})

		it('403 — пользователь не из команды не получает список проектов', async () => {
			await request(server)
				.get(`/teams/${teamId}/projects`)
				.set('Cookie', outsiderCookies)
				.expect(403)
		})
	})

	describe('GET /teams/:teamId/projects/:id', () => {
		it('возвращает один проект', async () => {
			const project = await createProject()

			const res = await request(server)
				.get(`/teams/${teamId}/projects/${project.id}`)
				.set('Cookie', ownerCookies)
				.expect(200)

			const body = res.body as Record<string, unknown>

			expectProjectResponse(body, {
				id: project.id,
				name: project.name,
				description: project.description,
				teamId,
			})
		})
	})

	describe('PATCH /teams/:teamId/projects/:id', () => {
		it('обновляет проект', async () => {
			const project = await createProject()

			const res = await request(server)
				.patch(`/teams/${teamId}/projects/${project.id}`)
				.set('Cookie', ownerCookies)
				.send({ name: 'Updated Project', description: 'Updated description' })
				.expect(200)

			const body = res.body as Record<string, unknown>

			expectProjectResponse(body, {
				id: project.id,
				name: 'Updated Project',
				description: 'Updated description',
				teamId,
			})
		})
	})

	describe('DELETE /teams/:teamId/projects/:id', () => {
		it('удаляет проект и возвращает 204', async () => {
			const project = await createProject()

			await request(server)
				.delete(`/teams/${teamId}/projects/${project.id}`)
				.set('Cookie', ownerCookies)
				.expect(204)

			await request(server)
				.get(`/teams/${teamId}/projects/${project.id}`)
				.set('Cookie', ownerCookies)
				.expect(404)
		})
	})
})
