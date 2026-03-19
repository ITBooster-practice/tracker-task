import type { Server } from 'http'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import type { Redis } from 'ioredis'

import { PrismaService } from '../../prisma/prisma.service'
import { createTestApp, registerAndLogin } from '../helpers/e2e.helpers'

describe('TeamMembers (e2e)', () => {
	let app: INestApplication
	let server: Server
	let prisma: PrismaService
	let redisClient: Redis

	let ownerToken: string
	let adminToken: string
	let memberToken: string
	let strangerToken: string

	let ownerId: string
	let adminId: string
	let memberId: string
	let strangerId: string

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
		await prisma.teamMember.deleteMany()
		await prisma.team.deleteMany()
		await prisma.user.deleteMany()
		await redisClient.flushall()

		// Создаём 4 пользователей: owner, admin, member, stranger (не в команде)
		const ownerAuth = await registerAndLogin(app, 'owner@test.com')
		const adminAuth = await registerAndLogin(app, 'admin@test.com')
		const memberAuth = await registerAndLogin(app, 'member@test.com')
		const strangerAuth = await registerAndLogin(app, 'stranger@test.com')

		ownerToken = ownerAuth.accessToken
		adminToken = adminAuth.accessToken
		memberToken = memberAuth.accessToken
		strangerToken = strangerAuth.accessToken

		// Создаём команду от имени owner
		const createRes = await request(server)
			.post('/teams/new')
			.set('Authorization', `Bearer ${ownerToken}`)
			.send({ name: 'Test Team' })
			.expect(201)

		teamId = createRes.body.id as string

		// Получаем userId каждого пользователя из БД
		const [ownerUser, adminUser, memberUser, strangerUser] = await Promise.all([
			prisma.user.findUnique({ where: { email: 'owner@test.com' } }),
			prisma.user.findUnique({ where: { email: 'admin@test.com' } }),
			prisma.user.findUnique({ where: { email: 'member@test.com' } }),
			prisma.user.findUnique({ where: { email: 'stranger@test.com' } }),
		])

		ownerId = ownerUser!.id
		adminId = adminUser!.id
		memberId = memberUser!.id
		strangerId = strangerUser!.id

		// Добавляем admin и member в команду напрямую через призму
		await prisma.teamMember.createMany({
			data: [
				{ teamId, userId: adminId, role: 'ADMIN' },
				{ teamId, userId: memberId, role: 'MEMBER' },
			],
		})
	})

	// ── GET /teams/:id/members ────────────────────────────────────────────────
	describe('GET /teams/:id/members', () => {
		it('должен вернуть 200 и список участников для члена команды', async () => {
			const res = await request(server)
				.get(`/teams/${teamId}/members`)
				.set('Authorization', `Bearer ${ownerToken}`)
				.expect(200)

			expect(res.body).toHaveLength(3)
			expect(res.body).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ userId: ownerId, role: 'OWNER' }),
					expect.objectContaining({ userId: adminId, role: 'ADMIN' }),
					expect.objectContaining({ userId: memberId, role: 'MEMBER' }),
				]),
			)
		})

		it('должен вернуть 401 без токена', async () => {
			await request(server).get(`/teams/${teamId}/members`).expect(401)
		})

		it('должен вернуть 403 если пользователь не в команде', async () => {
			await request(server)
				.get(`/teams/${teamId}/members`)
				.set('Authorization', `Bearer ${strangerToken}`)
				.expect(403)
		})

		it('должен вернуть 404 если команда не найдена', async () => {
			await request(server)
				.get('/teams/00000000-0000-0000-0000-000000000000/members')
				.set('Authorization', `Bearer ${ownerToken}`)
				.expect(404)
		})
	})

	// ── PATCH /teams/:id/members/:userId/role ─────────────────────────────────
	describe('PATCH /teams/:id/members/:userId/role', () => {
		it('должен вернуть 200 когда OWNER меняет роль MEMBER на ADMIN', async () => {
			const res = await request(server)
				.patch(`/teams/${teamId}/members/${memberId}/role`)
				.set('Authorization', `Bearer ${ownerToken}`)
				.send({ role: 'ADMIN' })
				.expect(200)

			expect(res.body).toMatchObject({ userId: memberId, role: 'ADMIN' })
		})

		it('должен вернуть 403 если MEMBER пытается изменить роль', async () => {
			await request(server)
				.patch(`/teams/${teamId}/members/${adminId}/role`)
				.set('Authorization', `Bearer ${memberToken}`)
				.send({ role: 'MEMBER' })
				.expect(403)
		})

		it('должен вернуть 403 если пытаются изменить свою собственную роль', async () => {
			await request(server)
				.patch(`/teams/${teamId}/members/${ownerId}/role`)
				.set('Authorization', `Bearer ${ownerToken}`)
				.send({ role: 'ADMIN' })
				.expect(403)
		})

		it('должен вернуть 403 при попытке изменить роль OWNER', async () => {
			await request(server)
				.patch(`/teams/${teamId}/members/${ownerId}/role`)
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ role: 'MEMBER' })
				.expect(403)
		})

		it('должен вернуть 404 если целевой участник не найден в команде', async () => {
			await request(server)
				.patch(`/teams/${teamId}/members/${strangerId}/role`)
				.set('Authorization', `Bearer ${ownerToken}`)
				.send({ role: 'MEMBER' })
				.expect(404)
		})

		it('должен вернуть 401 без токена', async () => {
			await request(server)
				.patch(`/teams/${teamId}/members/${memberId}/role`)
				.send({ role: 'ADMIN' })
				.expect(401)
		})
	})

	// ── DELETE /teams/:id/members/:userId ─────────────────────────────────────
	describe('DELETE /teams/:id/members/:userId', () => {
		it('должен вернуть 200 когда OWNER удаляет MEMBER', async () => {
			const res = await request(server)
				.delete(`/teams/${teamId}/members/${memberId}`)
				.set('Authorization', `Bearer ${ownerToken}`)
				.expect(200)

			expect(res.body).toEqual({ message: 'Участник успешно исключён', success: true })
		})

		it('должен вернуть 200 при самоуходе участника (self-leave)', async () => {
			const res = await request(server)
				.delete(`/teams/${teamId}/members/${memberId}`)
				.set('Authorization', `Bearer ${memberToken}`)
				.expect(200)

			expect(res.body).toEqual({ message: 'Вы покинули команду', success: true })
		})

		it('должен вернуть 403 если MEMBER пытается удалить другого участника', async () => {
			await request(server)
				.delete(`/teams/${teamId}/members/${adminId}`)
				.set('Authorization', `Bearer ${memberToken}`)
				.expect(403)
		})

		it('должен вернуть 403 при попытке удалить OWNER', async () => {
			await request(server)
				.delete(`/teams/${teamId}/members/${ownerId}`)
				.set('Authorization', `Bearer ${adminToken}`)
				.expect(403)
		})

		it('должен вернуть 401 без токена', async () => {
			await request(server).delete(`/teams/${teamId}/members/${memberId}`).expect(401)
		})
	})
})
