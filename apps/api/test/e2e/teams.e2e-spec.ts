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

	// Токены двух разных пользователей
	let ownerToken: string
	let memberToken: string

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

		ownerToken = owner.accessToken
		memberToken = member.accessToken
	})

	// ── POST /teams/new ───────────────────────────────────────────────────────
	describe('POST /teams/new', () => {
		it('должен создать команду и вернуть 201 с данными команды и ролью OWNER', async () => {
			const res = await request(server)
				.post('/teams/new')
				.set('Authorization', `Bearer ${ownerToken}`)
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
				.set('Authorization', `Bearer ${ownerToken}`)
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
				.set('Authorization', `Bearer ${ownerToken}`)
				.send({ name: 'Dream Team' })
				.expect(201)

			const res = await request(server)
				.get('/teams')
				.set('Authorization', `Bearer ${ownerToken}`)
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
				.set('Authorization', `Bearer ${ownerToken}`)
				.expect(200)

			expect(res.body).toEqual([])
		})
	})

	// ── DELETE /teams/:id ─────────────────────────────────────────────────────
	describe('DELETE /teams/:id', () => {
		it('OWNER может удалить команду и получает подтверждение', async () => {
			const createRes = await request(server)
				.post('/teams/new')
				.set('Authorization', `Bearer ${ownerToken}`)
				.send({ name: 'Dream Team' })
				.expect(201)

			const teamId = createRes.body.id

			const res = await request(server)
				.delete(`/teams/${teamId}`)
				.set('Authorization', `Bearer ${ownerToken}`)
				.expect(200)

			expect(res.body).toEqual({ message: 'Команда успешно удалена', success: true })
		})

		it('должен вернуть 403 если пользователь не состоит в команде', async () => {
			const createRes = await request(server)
				.post('/teams/new')
				.set('Authorization', `Bearer ${ownerToken}`)
				.send({ name: 'Dream Team' })
				.expect(201)

			const teamId = createRes.body.id

			await request(server)
				.delete(`/teams/${teamId}`)
				.set('Authorization', `Bearer ${memberToken}`)
				.expect(403)
		})

		it('должен вернуть 401 без токена', async () => {
			await request(server).delete('/teams/some-id').expect(401)
		})
	})
})
