import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaModule } from '../../prisma/prisma.module'

describe('Prisma Connection (e2e)', () => {
	let app: INestApplication
	let prismaService: PrismaService

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [PrismaModule],
		}).compile()

		app = moduleFixture.createNestApplication()
		await app.init()

		prismaService = moduleFixture.get<PrismaService>(PrismaService)
	})

	afterAll(async () => {
		if (prismaService) {
			await prismaService.$disconnect()
		}
		if (app) {
			await app.close()
		}
	})

	it('Подключение к базе данных', async () => {
		// Простой запрос для проверки подключения
		const result = await prismaService.$queryRaw`SELECT 1 as value`
		expect(result).toBeDefined()
		expect(Array.isArray(result)).toBe(true)
	})

	it('Выполнение raw запроса', async () => {
		const result = await prismaService.$queryRaw<
			Array<{ now: Date }>
		>`SELECT NOW() as now`
		expect(result[0]).toHaveProperty('now')
		expect(result[0].now).toBeInstanceOf(Date)
	})

	it('Доступ к модели User', async () => {
		// Проверяем, что модель доступна
		const count = await prismaService.user.count()
		expect(typeof count).toBe('number')
	})
})
