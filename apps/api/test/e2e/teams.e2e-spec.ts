import type { Server } from 'http'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import type { Redis } from 'ioredis'

import { PrismaService } from '../../prisma/prisma.service'
import { createTestApp, registerAndLogin } from '../helpers/e2e.helpers'

describe('Teams (e2e)', () => {
	let app: INestApplication
	let server: Server
	let prisma: PrismaService
	let redisClient: Redis

	// Cookies двух разных пользователей
	let ownerCookies: string
	let memberCookies: string

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
		// Чистим таблицы и Redis перед каждым тестом чтобы не было конфликтов
		await prisma.teamMember.deleteMany()
		await prisma.team.deleteMany()
		await prisma.user.deleteMany()
		await redisClient.flushall()

		// Создаём двух пользователей
		const owner = await registerAndLogin(app, 'owner@example.com')
		const member = await registerAndLogin(app, 'member@example.com')

		ownerCookies = owner.cookies
		memberCookies = member.cookies
	})

	// ── POST /teams/new ───────────────────────────────────────────────────────
	describe('POST /teams/new', () => {
		it('должен создать команду и вернуть 201 с данными команды и ролью OWNER', async () => {
			const res = await request(server)
				.post('/teams/new')
				.set('Cookie', ownerCookies)
				.send({ name: 'Dream Team' })
				.expect(201)

			expect(res.body).toMatchObject({
				id: expect.any(String),
				name: 'Dream Team',
				members: expect.arrayContaining([expect.objectContaining({ role: 'OWNER' })]),
			})
		})

		it('должен вернуть 401 без токена', async () => {
			await request(server).post('/teams/new').send({ name: 'Dream Team' }).expect(401)
		})

		it('должен вернуть 400 если name короче 2 символов', async () => {
			await request(server)
				.post('/teams/new')
				.set('Cookie', ownerCookies)
				.send({ name: 'X' })
				.expect(400)
		})
	})

	// ── GET /teams ────────────────────────────────────────────────────────────
	describe('GET /teams', () => {
		it('должен вернуть список команд текущего пользователя', async () => {
			// Создаём команду
			await request(server)
				.post('/teams/new')
				.set('Cookie', ownerCookies)
				.send({ name: 'Dream Team' })
				.expect(201)

			const res = await request(server)
				.get('/teams')
				.set('Cookie', ownerCookies)
				.expect(200)

			expect(res.body).toHaveLength(1)
			expect(res.body[0]).toMatchObject({
				name: 'Dream Team',
				membersCount: 1,
				currentUserRole: 'OWNER',
			})
		})

		it('должен вернуть пустой массив если у пользователя нет команд', async () => {
			const res = await request(server)
				.get('/teams')
				.set('Cookie', ownerCookies)
				.expect(200)

			expect(res.body).toEqual([])
		})
	})

	// ── DELETE /teams/:id ─────────────────────────────────────────────────────
	describe('DELETE /teams/:id', () => {
		it('OWNER может удалить команду и получает подтверждение', async () => {
			const createRes = await request(server)
				.post('/teams/new')
				.set('Cookie', ownerCookies)
				.send({ name: 'Dream Team' })
				.expect(201)

			const teamId = createRes.body.id

			const res = await request(server)
				.delete(`/teams/${teamId}`)
				.set('Cookie', ownerCookies)
				.expect(200)

			expect(res.body).toEqual({ message: 'Команда успешно удалена', success: true })
		})

		it('должен вернуть 403 если пользователь не состоит в команде', async () => {
			const createRes = await request(server)
				.post('/teams/new')
				.set('Cookie', ownerCookies)
				.send({ name: 'Dream Team' })
				.expect(201)

			const teamId = createRes.body.id

			await request(server)
				.delete(`/teams/${teamId}`)
				.set('Cookie', memberCookies)
				.expect(403)
		})

		it('должен вернуть 401 без токена', async () => {
			await request(server).delete('/teams/some-id').expect(401)
		})
	})

	// ── GET /teams/:id ────────────────────────────────────────────────────────
	describe('GET /teams/:id', () => {
		it('200 — участник получает команду с members', async () => {
			const createRes = await request(server)
				.post('/teams/new')
				.set('Cookie', ownerCookies)
				.send({ name: 'Dream Team' })
				.expect(201)

			const teamId = createRes.body.id as string

			const res = await request(server)
				.get(`/teams/${teamId}`)
				.set('Cookie', ownerCookies)
				.expect(200)

			expect(res.body).toMatchObject({
				id: teamId,
				name: 'Dream Team',
				members: expect.arrayContaining([expect.objectContaining({ role: 'OWNER' })]),
			})
		})

		it('403 — не участник не получает команду', async () => {
			const createRes = await request(server)
				.post('/teams/new')
				.set('Cookie', ownerCookies)
				.send({ name: 'Dream Team' })
				.expect(201)

			const teamId = createRes.body.id as string

			await request(server)
				.get(`/teams/${teamId}`)
				.set('Cookie', memberCookies)
				.expect(403)
		})

		it('404 — несуществующий id', async () => {
			await request(server)
				.get('/teams/00000000-0000-0000-0000-000000000000')
				.set('Cookie', ownerCookies)
				.expect(404)
		})

		it('401 — без токена', async () => {
			await request(server).get('/teams/00000000-0000-0000-0000-000000000000').expect(401)
		})
	})

	// ── PATCH /teams/:id ──────────────────────────────────────────────────────
	describe('PATCH /teams/:id', () => {
		let adminCookies: string
		let inTeamMemberCookies: string
		let patchTeamId: string

		beforeEach(async () => {
			// Создаём команду от имени owner
			const createRes = await request(server)
				.post('/teams/new')
				.set('Cookie', ownerCookies)
				.send({ name: 'Patch Team' })
				.expect(201)

			patchTeamId = createRes.body.id as string

			// Регистрируем admin и member для этого describe
			const adminAuth = await registerAndLogin(app, 'admin@patch.com')
			const memberAuth = await registerAndLogin(app, 'member@patch.com')

			adminCookies = adminAuth.cookies
			inTeamMemberCookies = memberAuth.cookies

			// Получаем userId через prisma
			const [adminUser, memberUser] = await Promise.all([
				prisma.user.findUnique({ where: { email: 'admin@patch.com' } }),
				prisma.user.findUnique({ where: { email: 'member@patch.com' } }),
			])

			// Добавляем их в команду с нужными ролями
			await prisma.teamMember.createMany({
				data: [
					{ teamId: patchTeamId, userId: adminUser!.id, role: 'ADMIN' },
					{ teamId: patchTeamId, userId: memberUser!.id, role: 'MEMBER' },
				],
			})
		})
	})
})
