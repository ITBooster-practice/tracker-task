# Как писать тесты: руководство по проекту

Практический гайд на основе нашего кода — как устроена система тестирования, зачем каждая часть и как добавлять новые тесты.

## Содержание

- [Структура и разделение](#структура-и-разделение)
- [Конфигурация Vitest](#конфигурация-vitest)
- [Моки](#моки)
- [Хелперы для unit-тестов](#хелперы-для-unit-тестов)
- [Хелперы для e2e-тестов](#хелперы-для-e2e-тестов)
- [Как написать unit-тест: пошагово](#как-написать-unit-тест-пошагово)
- [Как написать e2e-тест: пошагово](#как-написать-e2e-тест-пошагово)
- [Соглашения](#соглашения)

---

## Структура и разделение

```
test/
├── mocks/          # Замены реальных библиотек (argon2)
├── helpers/        # Фабрики моков и переиспользуемые фикстуры
├── unit/           # Тесты без БД и HTTP
└── e2e/            # Тесты с реальным приложением (БД + Redis)
```

**Unit** — тестируем логику сервиса изолированно. Быстро, без Docker.
**E2E** — тестируем HTTP-эндпоинты с реальной БД. Нужен `docker-compose.test.yml`.

---

## Конфигурация Vitest

### Unit: `vitest.config.ts`

```typescript
// Наследует nestConfig из packages/vitest-config/src/nest.ts
// nestConfig включает: globals: true, environment: 'node', coverage v8
export default mergeConfig(
	nestConfig,
	defineConfig({
		plugins: [tsconfigPaths(), swc.vite()], // алиасы путей + SWC-транспиляция
		test: {
			include: ['src/**/*.spec.ts', 'test/unit/**/*.spec.ts'],
			setupFiles: ['./vitest.setup.ts'],
		},
	}),
)
```

### E2E: `vitest.config.e2e.ts`

```typescript
export default defineConfig({
	plugins: [tsconfigPaths(), swc.vite()],
	test: {
		root: './test',
		include: ['**/*.e2e-spec.ts'],
		globals: true,
		setupFiles: ['../vitest.setup.ts'],
		fileParallelism: false, // ← ВАЖНО: e2e-файлы делят одну БД, нельзя параллельно
	},
})
```

### Setup-файл: `vitest.setup.ts`

```typescript
import 'reflect-metadata' // нужен для декораторов NestJS

import { config } from 'dotenv'

config({ path: '.env.test' }) // загружает тестовые переменные окружения
```

> `.env.test` должен лежать в `apps/api/`. В нём тестовые DATABASE_URL, Redis, JWT-секреты.

---

## Моки

### `test/mocks/argon2.ts`

Argon2 — медленная библиотека хэширования. В unit-тестах заменяем её мгновенными `vi.fn()`:

```typescript
// test/mocks/argon2.ts
export const hash = vi.fn().mockResolvedValue('hashed_password')
export const verify = vi.fn()
```

Подключается в тест-файле через:

```typescript
vi.mock('argon2', async () => await import('../../mocks/argon2'))
```

**Правило:** мок-файл создаём, когда нужно заменить целый npm-пакет для всего файла тестов.

---

## Хелперы для unit-тестов

Хелперы живут в `test/helpers/` и переиспользуются в нескольких spec-файлах.

### `auth.helpers.ts` — фабрики для AuthService

| Фабрика                  | Возвращает                                                                             |
| ------------------------ | -------------------------------------------------------------------------------------- |
| `createPrismaMock()`     | `PrismaService` с `vi.fn()` на `user.findUnique`, `user.create`                        |
| `createJwtMock()`        | `JwtService` с настроенным `sign` (возвращает `'access.token'` / `'refresh.token'`)    |
| `createConfigMock()`     | `ConfigService` — читает из `process.env`, бросает ошибку если ключа нет               |
| `createRedisMock()`      | `RedisService` с заглушками `setRefreshToken`, `deleteRefreshToken`, `getRefreshToken` |
| `createResMock()`        | `express.Response` с `vi.fn()` на `cookie`                                             |
| `createReqMock(cookies)` | `express.Request` с указанными cookies                                                 |
| `createMailMock()`       | `MailService` с заглушкой `sendWelcomeEmail`                                           |

### `teams.helpers.ts` — фабрики и фикстуры для Teams

```typescript
// Фабрика Prisma с нужными методами для teams/teamMember
createPrismaMock()

// Готовые константы — не создавать объекты в каждом тесте:
USER_ID // 'user-id-1'
TEAM_ID // 'team-id-1'
MEMBER_OWNER // { role: 'OWNER', userId: USER_ID, ... }
MEMBER_ADMIN // { role: 'ADMIN', userId: 'user-id-2', ... }
MEMBER_PLAIN // { role: 'MEMBER', userId: 'user-id-3', ... }
TEAM // полный объект команды с members[]
```

### `guards.helpers.ts` — мок ExecutionContext для гардов

```typescript
// Создаёт минимальный мок ExecutionContext:
// user — объект из request.user (по умолчанию { id: USER_ID })
// teamId — значение из request.params.teamId (по умолчанию TEAM_ID)
// Передайте null чтобы сымитировать отсутствие поля
createCtx(user?, teamId?)
```

Пример использования в тесте гарда:

```typescript
import { createCtx } from '../../helpers/guards.helpers'

// Валидный запрос
guard.canActivate(createCtx({ id: USER_ID }))

// Запрос без user
guard.canActivate(createCtx(null, TEAM_ID))

// Запрос без teamId
guard.canActivate(createCtx({ id: USER_ID }, null))
```

**Когда создавать новый хелпер-файл:** когда появляется новый сервис с зависимостями (новый `createPrismaMock` с другими методами) или набор фикстур, нужных в нескольких spec-файлах.

---

## Хелперы для e2e-тестов

### `e2e.helpers.ts`

**`createTestApp()`** — поднимает полноценное приложение:

- Импортирует весь `AppModule`
- Подключает `CustomZodValidationPipe` и `ZodSerializerInterceptor`
- Мокирует `MailService` (не нужно реально отправлять письма)
- Подключает `cookieParser`
- Возвращает `{ app, prisma, redisClient }`

```typescript
const { app, prisma, redisClient } = await createTestApp()
server = app.getHttpServer()
```

**`registerAndLogin(app, email, password?, name?)`** — регистрирует пользователя и возвращает его cookies одной строкой. Нужен везде, где тест требует авторизации.

```typescript
const { cookies } = await registerAndLogin(app, 'user@example.com')
await request(server).get('/teams').set('Cookie', cookies).expect(200)
```

---

## Как написать unit-тест: пошагово

**Пример:** добавляем тесты для нового `NotificationsService`.

### 1. Создать хелпер-файл (если нужен новый мок Prisma)

```typescript
// test/helpers/notifications.helpers.ts
export function createPrismaMock() {
	return {
		notification: {
			create: vi.fn(),
			findMany: vi.fn(),
			update: vi.fn(),
		},
	} as unknown as PrismaService
}

export const NOTIFICATION = {
	id: 'notif-id-1',
	userId: 'user-id-1',
	message: 'Test notification',
	read: false,
	createdAt: new Date(),
}
```

### 2. Создать spec-файл

```typescript
// test/unit/notifications/notifications.service.spec.ts
import { NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NotificationsService } from '../../../src/notifications/notifications.service'
import { createPrismaMock, NOTIFICATION } from '../../helpers/notifications.helpers'

describe('NotificationsService', () => {
	let service: NotificationsService
	let prisma: ReturnType<typeof createPrismaMock>

	beforeEach(() => {
		vi.clearAllMocks() // сброс всех моков перед каждым тестом
		prisma = createPrismaMock()
		service = new NotificationsService(prisma) // прямое создание, без DI
	})

	describe('getByUser', () => {
		it('должен вернуть уведомления пользователя', async () => {
			prisma.notification.findMany.mockResolvedValue([NOTIFICATION])

			const result = await service.getByUser('user-id-1')

			expect(prisma.notification.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ where: { userId: 'user-id-1' } }),
			)
			expect(result).toHaveLength(1)
		})

		it('должен вернуть пустой массив если уведомлений нет', async () => {
			prisma.notification.findMany.mockResolvedValue([])
			expect(await service.getByUser('user-id-1')).toEqual([])
		})
	})
})
```

### 3. Запустить

```bash
pnpm test                    # прогнать все unit-тесты
pnpm test:watch              # watch-режим во время разработки
```

---

## Как написать e2e-тест: пошагово

**Пример:** добавляем e2e для нового `POST /notifications`.

### 1. Создать файл с суффиксом `.e2e-spec.ts`

```typescript
// test/e2e/notifications.e2e-spec.ts
import type { Server } from 'http'
import { INestApplication } from '@nestjs/common'
import type { Redis } from 'ioredis'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { PrismaService } from '../../prisma/prisma.service'
import { createTestApp, registerAndLogin } from '../helpers/e2e.helpers'

describe('Notifications (e2e)', () => {
	let app: INestApplication
	let server: Server
	let prisma: PrismaService
	let redisClient: Redis
	let cookies: string

	// ── Один раз на весь suite ────────────────────────────────────────────────
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

	// ── Сброс данных перед каждым тестом ──────────────────────────────────────
	beforeEach(async () => {
		await prisma.notification.deleteMany()
		await prisma.user.deleteMany()
		await redisClient.flushall()

		const auth = await registerAndLogin(app, 'user@example.com')
		cookies = auth.cookies
	})

	describe('POST /notifications', () => {
		it('должен вернуть 201', async () => {
			await request(server)
				.post('/notifications')
				.set('Cookie', cookies)
				.send({ message: 'Hello' })
				.expect(201)
		})

		it('должен вернуть 401 без токена', async () => {
			await request(server).post('/notifications').send({ message: 'Hello' }).expect(401)
		})
	})
})
```

### 2. Запустить e2e

```bash
# Поднять тестовую БД и Redis
docker-compose -f docker-compose.test.yml up -d

# Прогнать e2e
pnpm test:e2e
```

---

## Соглашения

### Именование

| Тип       | Шаблон                | Пример                 |
| --------- | --------------------- | ---------------------- |
| Unit-тест | `*.spec.ts`           | `auth.service.spec.ts` |
| E2E-тест  | `*.e2e-spec.ts`       | `auth.e2e-spec.ts`     |
| Хелпер    | `<domain>.helpers.ts` | `auth.helpers.ts`      |

### Unit-тесты

- Сервис инстанциируется **напрямую** (`new MyService(prisma, ...)`) — не через NestJS DI
- `vi.clearAllMocks()` — всегда в `beforeEach`
- Фикстуры (`TEAM`, `USER_ID`) — константы вверху файла или в `helpers/`, не inline в тестах
- Один тест — один сценарий. Не смешивать happy path и ошибки в одном `it()`

### E2E-тесты

- `createTestApp()` — в `beforeAll`, не в `beforeEach` (дорогая операция)
- Очистка таблиц — в `beforeEach`, порядок: дочерние → родительские (`teamMember` → `team` → `user`)
- `fileParallelism: false` в конфиге — файлы запускаются строго последовательно, т.к. делят БД
- `MailService` мокирован внутри `createTestApp()` — ничего дополнительно делать не нужно
- Для получения cookies авторизованного пользователя — использовать `registerAndLogin()`

### Что проверять

- **Happy path** — основной сценарий работает
- **Auth guard** — 401 без токена (для каждого защищённого эндпоинта)
- **Права доступа** — 403 для недостаточной роли
- **Валидация** — 400 для невалидных данных
- **Not found** — 404 для несуществующих ресурсов
