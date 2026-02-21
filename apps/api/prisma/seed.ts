/**
 * Seed файл для заполнения базы данных тестовыми данными
 *
 * ВАЖНО: Перед запуском seed необходимо:
 * 1. Выполнить миграции: pnpm prisma:migrate
 * 2. Сгенерировать Prisma Client: pnpm prisma:generate
 *
 * Запуск:
 * - Из корня проекта: pnpm prisma:seed
 * - Из apps/api: pnpm prisma:seed
 */

import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Создание Prisma Client с адаптером для PostgreSQL (Prisma 7.x)
const pool = new Pool({ connectionString: process.env['DATABASE_URL'] })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

/**
 * Основная функция для заполнения базы данных тестовыми данными
 */
async function main() {
	console.log('🌱 Начало заполнения базы данных...')

	// Очистка существующих данных (опционально, раскомментируйте при необходимости)
	// await prisma.task.deleteMany()
	// await prisma.project.deleteMany()
	// await prisma.user.deleteMany()

	// Создание пользователей
	console.log('👤 Создание пользователей...')
	const user1 = await prisma.user.create({
		data: {
			email: 'admin@example.com',
			name: 'Администратор',
			password: 'hashed_password_123', // В реальном приложении используйте bcrypt
		},
	})

	const user2 = await prisma.user.create({
		data: {
			email: 'developer@example.com',
			name: 'Разработчик',
			password: 'hashed_password_456',
		},
	})

	const user3 = await prisma.user.create({
		data: {
			email: 'manager@example.com',
			name: 'Менеджер проектов',
			password: 'hashed_password_789',
		},
	})

	console.log(`✅ Создано пользователей: 3`)

	// Создание проектов
	console.log('📁 Создание проектов...')
	const project1 = await prisma.project.create({
		data: {
			name: 'Веб-приложение трекера задач',
			description:
				'Разработка системы управления задачами с использованием NestJS и Next.js',
			createdById: user1.id,
		},
	})

	const project2 = await prisma.project.create({
		data: {
			name: 'Мобильное приложение',
			description: 'Разработка мобильного клиента для трекера задач',
			createdById: user3.id,
		},
	})

	console.log(`✅ Создано проектов: 2`)

	// Создание задач для первого проекта
	console.log('📝 Создание задач...')
	await prisma.task.createMany({
		data: [
			{
				title: 'Настройка базы данных',
				description: 'Настроить PostgreSQL и Prisma ORM',
				status: 'DONE',
				priority: 'HIGH',
				projectId: project1.id,
				assigneeId: user2.id,
			},
			{
				title: 'Создание API эндпоинтов',
				description: 'Реализовать CRUD операции для задач и проектов',
				status: 'IN_PROGRESS',
				priority: 'HIGH',
				projectId: project1.id,
				assigneeId: user2.id,
			},
			{
				title: 'Разработка UI компонентов',
				description: 'Создать переиспользуемые компоненты с shadcn/ui',
				status: 'IN_PROGRESS',
				priority: 'MEDIUM',
				projectId: project1.id,
				assigneeId: user2.id,
			},
			{
				title: 'Написание тестов',
				description: 'Покрыть основную функциональность unit и e2e тестами',
				status: 'TODO',
				priority: 'MEDIUM',
				projectId: project1.id,
				assigneeId: user2.id,
			},
			{
				title: 'Настройка CI/CD',
				description: 'Настроить GitHub Actions для автоматического деплоя',
				status: 'TODO',
				priority: 'LOW',
				projectId: project1.id,
				assigneeId: null, // Задача пока не назначена
			},
		],
	})

	// Создание задач для второго проекта
	await prisma.task.createMany({
		data: [
			{
				title: 'Исследование технологий',
				description: 'Выбор стека для мобильной разработки (React Native vs Flutter)',
				status: 'IN_REVIEW',
				priority: 'CRITICAL',
				projectId: project2.id,
				assigneeId: user3.id,
			},
			{
				title: 'Дизайн мобильного интерфейса',
				description: 'Создание макетов в Figma',
				status: 'TODO',
				priority: 'HIGH',
				projectId: project2.id,
				assigneeId: null,
			},
			{
				title: 'Прототип приложения',
				description: 'Разработка MVP с базовым функционалом',
				status: 'TODO',
				priority: 'MEDIUM',
				projectId: project2.id,
				assigneeId: null,
			},
		],
	})

	console.log(`✅ Создано задач: 8`)

	console.log('✨ Заполнение базы данных завершено успешно!')
}

// Выполнение seed функции
main()
	.catch((e) => {
		console.error('❌ Ошибка при заполнении базы данных:', e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
