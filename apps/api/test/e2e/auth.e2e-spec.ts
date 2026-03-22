import type { Server } from 'http'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import type { Redis } from 'ioredis'

import { PrismaService } from '../../prisma/prisma.service'
import { createTestApp, registerAndLogin } from '../helpers/e2e.helpers'

// Извлекает значение cookie по имени из массива Set-Cookie заголовков
function getCookieValue(setCookie: string | string[], name: string): string | undefined {
	const cookies = Array.isArray(setCookie) ? setCookie : [setCookie]
	const found = cookies.find((c) => c.startsWith(`${name}=`))
	return found?.split(';')[0].split('=')[1]
}

describe('Auth (e2e)', () => {
	let app: INestApplication
	let server: Server
	let prisma: PrismaService
	let redisClient: Redis

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
		await prisma.user.deleteMany()
		await redisClient.flushall()
	})

	// ── POST /auth/register ───────────────────────────────────────────────────
	describe('POST /auth/register', () => {
		it('должен зарегистрировать пользователя, вернуть 201 и установить cookies', async () => {
			const res = await request(server)
				.post('/auth/register')
				.send({ email: 'alice@example.com', password: 'P@ssw0rd!', name: 'Alice' })
				.expect(201)

			const setCookie = res.headers['set-cookie'] ?? []
			expect(getCookieValue(setCookie, 'accessToken')).toBeDefined()
			expect(getCookieValue(setCookie, 'refreshToken')).toBeDefined()
		})

		it('должен вернуть 409 при повторной регистрации с тем же email', async () => {
			await request(server)
				.post('/auth/register')
				.send({ email: 'alice@example.com', password: 'P@ssw0rd!', name: 'Alice' })
				.expect(201)

			const res = await request(server)
				.post('/auth/register')
				.send({ email: 'alice@example.com', password: 'P@ssw0rd!', name: 'Alice' })
				.expect(409)

			expect(res.body.message).toBe('Пользователь с таким email уже существует')
		})

		it('должен вернуть 400 при некорректном email', async () => {
			await request(server)
				.post('/auth/register')
				.send({ email: 'not-an-email', password: 'P@ssw0rd!', name: 'Alice' })
				.expect(400)
		})

		it('должен вернуть 400 если пароль короче 6 символов', async () => {
			await request(server)
				.post('/auth/register')
				.send({ email: 'alice@example.com', password: '123', name: 'Alice' })
				.expect(400)
		})

		it('должен вернуть 400 если email не передан', async () => {
			await request(server)
				.post('/auth/register')
				.send({ password: 'P@ssw0rd!', name: 'Alice' })
				.expect(400)
		})
	})

	// ── POST /auth/login ──────────────────────────────────────────────────────
	describe('POST /auth/login', () => {
		beforeEach(async () => {
			// Создаём пользователя перед каждым тестом логина
			await request(server)
				.post('/auth/register')
				.send({ email: 'alice@example.com', password: 'P@ssw0rd!', name: 'Alice' })
				.expect(201)
		})

		it('должен выполнить вход, вернуть 200 и установить cookies', async () => {
			const res = await request(server)
				.post('/auth/login')
				.send({ email: 'alice@example.com', password: 'P@ssw0rd!' })
				.expect(200)

			const setCookie = res.headers['set-cookie'] ?? []
			expect(getCookieValue(setCookie, 'accessToken')).toBeDefined()
			expect(getCookieValue(setCookie, 'refreshToken')).toBeDefined()
		})

		it('должен вернуть 404 при входе с несуществующим email', async () => {
			const res = await request(server)
				.post('/auth/login')
				.send({ email: 'nobody@example.com', password: 'P@ssw0rd!' })
				.expect(404)

			expect(res.body.message).toBe('Пользователь не найден')
		})

		it('должен вернуть 404 при входе с неверным паролем', async () => {
			const res = await request(server)
				.post('/auth/login')
				.send({ email: 'alice@example.com', password: 'WrongPass1!' })
				.expect(404)

			expect(res.body.message).toBe('Пользователь не найден')
		})

		it('должен вернуть 400 при некорректном email', async () => {
			await request(server)
				.post('/auth/login')
				.send({ email: 'bad-email', password: 'P@ssw0rd!' })
				.expect(400)
		})

		it('должен вернуть 400 если пароль не передан', async () => {
			await request(server)
				.post('/auth/login')
				.send({ email: 'alice@example.com' })
				.expect(400)
		})
	})

	// ── POST /auth/refresh ────────────────────────────────────────────────────
	describe('POST /auth/refresh', () => {
		let cookies: string

		beforeEach(async () => {
			const result = await registerAndLogin(app, 'alice@example.com')
			cookies = result.cookies
		})

		it('должен вернуть 200 и установить новые cookies при валидном refreshToken', async () => {
			const res = await request(server)
				.post('/auth/refresh')
				.set('Cookie', cookies)
				.expect(200)

			const setCookie = res.headers['set-cookie'] ?? []
			expect(getCookieValue(setCookie, 'accessToken')).toBeDefined()
			expect(getCookieValue(setCookie, 'refreshToken')).toBeDefined()
		})

		it('должен вернуть 401 если cookie не передан', async () => {
			await request(server).post('/auth/refresh').expect(401)
		})

		it('должен вернуть 401 при невалидном refreshToken', async () => {
			await request(server)
				.post('/auth/refresh')
				.set('Cookie', 'refreshToken=invalid.token.value')
				.expect(401)
		})
	})

	// ── POST /auth/logout ─────────────────────────────────────────────────────
	describe('POST /auth/logout', () => {
		let cookies: string

		beforeEach(async () => {
			const result = await registerAndLogin(app, 'alice@example.com')
			cookies = result.cookies
		})

		it('должен вернуть 200 и очистить cookies', async () => {
			const res = await request(server)
				.post('/auth/logout')
				.set('Cookie', cookies)
				.expect(200)

			const setCookie: string[] = Array.isArray(res.headers['set-cookie'])
				? res.headers['set-cookie']
				: [res.headers['set-cookie'] ?? '']

			const accessTokenCookie = setCookie.find((c) => c.startsWith('accessToken='))
			const refreshTokenCookie = setCookie.find((c) => c.startsWith('refreshToken='))

			expect(accessTokenCookie).toContain('accessToken=;')
			expect(refreshTokenCookie).toContain('refreshToken=;')
		})

		it('должен вернуть 200 если cookie не передан (идемпотентность)', async () => {
			const res = await request(server).post('/auth/logout').expect(200)

			expect(res.body).toEqual({ message: 'Пользователь успешно вышел', success: true })
		})
	})
})
