import type { Server } from 'http'
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import { APP_PIPE, APP_INTERCEPTOR } from '@nestjs/core'
import { ZodSerializerInterceptor } from 'nestjs-zod'
import cookieParser from 'cookie-parser'
import request from 'supertest'
import type { Redis } from 'ioredis'

import { AppModule } from '../../src/app.module'
import { PrismaService } from '../../prisma/prisma.service'
import { CustomZodValidationPipe } from '../../src/common/providers/zod-validation.provider'
import { REDIS_CLIENT } from '../../src/common/redis/redis.constants'
import { MailService } from '../../src/mail/mail.service'

const mailServiceMock = {
	sendWelcomeEmail: () => Promise.resolve(),
	sendTeamInvitationEmail: () => Promise.resolve(),
}

export async function createTestApp(): Promise<{
	app: INestApplication
	prisma: PrismaService
	redisClient: Redis
}> {
	const moduleFixture: TestingModule = await Test.createTestingModule({
		imports: [AppModule],
		providers: [
			{ provide: APP_PIPE, useClass: CustomZodValidationPipe },
			{ provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
		],
	})
		.overrideProvider(MailService)
		.useValue(mailServiceMock)
		.compile()

	const app = moduleFixture.createNestApplication()
	app.use(cookieParser())
	await app.init()

	const prisma = moduleFixture.get<PrismaService>(PrismaService)
	const redisClient = moduleFixture.get<Redis>(REDIS_CLIENT)

	return { app, prisma, redisClient }
}

// Регистрирует пользователя и возвращает cookies
export async function registerAndLogin(
	app: INestApplication,
	email: string,
	password = 'P@ssw0rd!',
	name = 'Test User',
): Promise<{ cookies: string }> {
	const res = await request(app.getHttpServer() as Server)
		.post('/auth/register')
		.send({ email, password, name })
		.expect(201)

	const setCookie = res.headers['set-cookie']
	const cookies = Array.isArray(setCookie) ? setCookie.join('; ') : (setCookie ?? '')

	return { cookies }
}
