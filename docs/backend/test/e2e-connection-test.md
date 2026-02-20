# E2E тест подключения Prisma

## Описание

Детальное объяснение нашего реального e2e теста, который проверяет подключение Prisma к базе данных и работоспособность схемы.

## Расположение файла

```
apps/api/test/e2e/prisma-connection.e2e-spec.ts
```

## Цель теста

Простая **read-only** проверка того, что:
1. Prisma подключается к реальной БД
2. Схема применена корректно
3. Модели доступны и работают

**Важно:** Тест **НЕ изменяет** данные в БД, только читает!

## Разбор кода по частям

### 1. Импорты

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
```
- **Vitest** — тестовый фреймворк (как Jest, но быстрее)
- `describe` — группирует связанные тесты
- `it` — один тест
- `expect` — проверяет результат
- `beforeAll` / `afterAll` — хуки жизненного цикла

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
```
- **NestJS Testing** — инструменты для создания тестового приложения

```typescript
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaModule } from '../../prisma/prisma.module'
```
- Наши файлы с PrismaService и модулем

---

### 2. Переменные для хранения состояния

```typescript
let app: INestApplication
let prismaService: PrismaService
```

Эти переменные будут доступны во всех тестах внутри `describe`.

---

### 3. beforeAll — Запуск приложения

```typescript
beforeAll(async () => {
	// Шаг 1: Создаём тестовый модуль
	const moduleFixture: TestingModule = await Test.createTestingModule({
		imports: [PrismaModule],
	}).compile()

	// Шаг 2: Создаём приложение
	app = moduleFixture.createNestApplication()

	// Шаг 3: Инициализируем (включаем)
	await app.init()

	// Шаг 4: Получаем PrismaService из DI контейнера
	prismaService = moduleFixture.get<PrismaService>(PrismaService)
})
```

**Что происходит:**
1. NestJS создаёт изолированное приложение
2. Подключает только PrismaModule
3. Prisma автоматически подключается к БД (через `onModuleInit`)
4. Мы получаем готовый PrismaService

---

### 4. Тест #1: Подключение работает?

```typescript
it('Подключение к базе данных', async () => {
	const result = await prismaService.$queryRaw`SELECT 1 as value`
	expect(result).toBeDefined()
	expect(Array.isArray(result)).toBe(true)
})
```

**Что делает:**
1. Выполняет SQL: `SELECT 1 as value`
2. PostgreSQL возвращает: `[{ value: 1 }]`
3. Проверяет: результат существует и это массив

**Зачем:**
- Убедиться, что подключение к БД работает
- Проверить, что Prisma может выполнять запросы

---

### 5. Тест #2: Raw запросы работают?

```typescript
it('Выполнение raw запроса', async () => {
	const result = await prismaService.$queryRaw<
		Array<{ now: Date }>
	>`SELECT NOW() as now`
	expect(result[0]).toHaveProperty('now')
	expect(result[0].now).toBeInstanceOf(Date)
})
```

**Что делает:**
1. Спрашивает БД: "Который сейчас час?"
2. БД отвечает текущим временем
3. Проверяет: ответ содержит поле `now` и это дата

**Зачем:**
- Проверить, что PostgreSQL функции работают
- Убедиться, что Prisma правильно типизирует результаты

---

### 6. Тест #3: Модели доступны?

```typescript
it('Доступ к модели User', async () => {
	const count = await prismaService.user.count()
	expect(typeof count).toBe('number')
})
```

**Что делает:**
1. Вызывает `prismaService.user.count()` — считает пользователей
2. Проверяет: результат — число (может быть 0)

**Зачем:**
- Убедиться, что таблица `User` существует
- Проверить, что миграции применены
- Проверить, что Prisma Client сгенерирован правильно

---

### 7. afterAll — Очистка

```typescript
afterAll(async () => {
	if (prismaService) {
		await prismaService.$disconnect()
	}
	if (app) {
		await app.close()
	}
})
```

**Что делает:**
1. Отключается от БД
2. Закрывает тестовое приложение

**Зачем:**
- Освободить ресурсы
- Закрыть соединения с БД
- Избежать утечек памяти

**Проверка на `if`** — защита от ситуации, когда `beforeAll` упал с ошибкой.

---

## Порядок выполнения

```
1. beforeAll        → Запустить NestJS + подключиться к БД
2. Тест #1          → SELECT 1
3. Тест #2          → SELECT NOW()
4. Тест #3          → COUNT users
5. afterAll         → Отключиться + закрыть приложение
```

---

## Как запустить

```bash
# Все e2e тесты
pnpm --filter=api test:e2e

# Только этот тест
pnpm --filter=api test:e2e prisma-connection
```

---

## Почему тест может упасть?

### Ошибка: `Cannot read properties of undefined (reading '$disconnect')`

**Причина:** `beforeAll` завершился с ошибкой, `prismaService` не создался.

**Решение:** Проверьте:
1. БД запущена?
2. `DATABASE_URL` правильный в `.env`?
3. Миграции применены?

### Ошибка: `client password must be a string`

**Причина:** Неправильный пароль в `DATABASE_URL`.

**Решение:** Проверьте `.env`:
```env
DATABASE_URL="postgresql://postgres:правильный_пароль@localhost:5432/tracker-task"
```

### Ошибка: `Table 'User' does not exist`

**Причина:** Миграции не применены.

**Решение:**
```bash
pnpm --filter=api prisma:migrate
```

---

## Что НЕ проверяет этот тест?

❌ Не создаёт тестовые данные
❌ Не изменяет БД
❌ Не проверяет CRUD операции
❌ Не тестирует бизнес-логику

**Это минимальный тест "дымовой проверки" (smoke test)** — просто убеждаемся, что всё подключено правильно.
