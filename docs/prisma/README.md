# Prisma ORM

## Описание

Prisma используется в качестве ORM для работы с PostgreSQL базой данных в API приложении.

## Установка

### 1. Установка зависимостей

Prisma установлена в пакете `apps/api`:

```bash
cd apps/api
pnpm add prisma @types/node @types/pg --save-dev
pnpm add @prisma/client @prisma/adapter-pg pg dotenv
```

### 2. Инициализация Prisma

```bash
cd apps/api
pnpm prisma init
```

Эта команда создаст:

- `prisma/schema.prisma` - файл схемы базы данных
- `.env` - файл с переменными окружения (если не существует)

## Структура файлов

```
apps/api/
├── prisma/
│   ├── schema.prisma       # Схема базы данных
│   └── migrations/         # Миграции базы данных
├── src/
│   └── lib/
│       └── prisma.ts       # Prisma Client instance (или в модуле)
└── .env                    # Переменные окружения
```

## Настройка

### 1. Переменные окружения

В файле `apps/api/.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/mydb?schema=public"
```

### 2. Схема Prisma

Файл `apps/api/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Пример модели
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

### 3. Prisma Client в NestJS

Создайте сервис Prisma в `apps/api/src/prisma/`:

```typescript
// prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
	async onModuleInit() {
		await this.$connect()
	}
}
```

```typescript
// prisma.module.ts
import { Module, Global } from '@nestjs/common'
import { PrismaService } from './prisma.service'

@Global()
@Module({
	providers: [PrismaService],
	exports: [PrismaService],
})
export class PrismaModule {}
```

Затем импортируйте `PrismaModule` в `AppModule`:

```typescript
import { Module } from '@nestjs/common'
import { PrismaModule } from './prisma/prisma.module'

@Module({
	imports: [PrismaModule],
	// ...
})
export class AppModule {}
```

## Работа с миграциями

### Создание миграции

```bash
# Из корня проекта
pnpm prisma:migrate

# Или из apps/api
pnpm prisma migrate dev --name init
```

Эта команда:

1. Создаст SQL файл миграции в `prisma/migrations/`
2. Применит миграцию к БД
3. Сгенерирует Prisma Client

### Применение миграций в production

```bash
pnpm prisma migrate deploy
```

### Сброс базы данных (только для dev)

```bash
cd apps/api
pnpm prisma migrate reset
```

**Внимание**: Эта команда удалит все данные!

## Генерация Prisma Client

После изменения схемы необходимо регенерировать клиент:

```bash
# Из корня проекта
pnpm prisma:generate

# Или из apps/api
pnpm prisma generate
```

**Важно**: Prisma Client автоматически генерируется при:

- Установке зависимостей (`pnpm install`)
- Выполнении миграций (`prisma migrate dev`)

## Prisma Studio

Веб-интерфейс для просмотра и редактирования данных:

```bash
# Из корня проекта
pnpm prisma:studio

# Или из apps/api
pnpm prisma studio
```

Откроется на http://localhost:5555

## Интеграция с Turbo

В `turbo.json` настроена задача `prisma:generate`:

```json
{
	"globalEnv": ["DATABASE_URL"],
	"tasks": {
		"dev": {
			"dependsOn": ["prisma:generate"],
			"env": ["DATABASE_URL"]
		},
		"build": {
			"dependsOn": ["^build", "prisma:generate"],
			"env": ["DATABASE_URL"]
		},
		"prisma:generate": {
			"cache": false,
			"env": ["DATABASE_URL"]
		}
	}
}
```

Это гарантирует, что Prisma Client всегда актуален перед запуском или сборкой.

## Скрипты

### В корневом package.json

```json
{
	"scripts": {
		"prisma:generate": "turbo run prisma:generate",
		"prisma:migrate": "pnpm --filter api prisma:migrate",
		"prisma:studio": "pnpm --filter api prisma:studio"
	}
}
```

### В apps/api/package.json

```json
{
	"scripts": {
		"prisma:generate": "prisma generate",
		"prisma:migrate": "prisma migrate dev",
		"prisma:studio": "prisma studio"
	}
}
```

## Использование в коде

### Пример в NestJS контроллере

```typescript
import { Controller, Get, Post, Body } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Controller('users')
export class UsersController {
	constructor(private readonly prisma: PrismaService) {}

	@Get()
	async findAll() {
		return this.prisma.user.findMany()
	}

	@Post()
	async create(@Body() data: { email: string; name?: string }) {
		return this.prisma.user.create({ data })
	}
}
```

### Пример сервиса

```typescript
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class UsersService {
	constructor(private readonly prisma: PrismaService) {}

	async findById(id: string) {
		return this.prisma.user.findUnique({
			where: { id },
			select: { id: true, email: true, name: true },
		})
	}

	async createUser(email: string, name?: string) {
		return this.prisma.user.create({
			data: { email, name },
		})
	}

	async updateUser(id: string, data: { name?: string }) {
		return this.prisma.user.update({
			where: { id },
			data,
		})
	}

	async deleteUser(id: string) {
		return this.prisma.user.delete({
			where: { id },
		})
	}
}
```

## Best Practices

### 1. Используйте транзакции для связанных операций

```typescript
await this.prisma.$transaction(async (tx) => {
	const user = await tx.user.create({
		data: { email: 'test@test.com' },
	})
	await tx.profile.create({
		data: { userId: user.id },
	})
})
```

### 2. Используйте select для оптимизации запросов

```typescript
const user = await this.prisma.user.findUnique({
	where: { id },
	select: {
		id: true,
		email: true,
		name: true,
		// не выбираем поля, которые не нужны
	},
})
```

### 3. Обрабатывайте ошибки Prisma

```typescript
import { Prisma } from '@prisma/client'

try {
	await this.prisma.user.create({ data: { email } })
} catch (error) {
	if (error instanceof Prisma.PrismaClientKnownRequestError) {
		if (error.code === 'P2002') {
			// Unique constraint violation
			throw new ConflictException('Email already exists')
		}
	}
	throw error
}
```

### 4. Используйте middleware для логирования (dev)

```typescript
// В prisma.service.ts
async onModuleInit() {
  await this.$connect();

  if (process.env.NODE_ENV === 'development') {
    this.$use(async (params, next) => {
      const before = Date.now();
      const result = await next(params);
      const after = Date.now();
      console.log(`Query ${params.model}.${params.action} took ${after - before}ms`);
      return result;
    });
  }
}
```

### 5. Используйте include вместо нескольких запросов

```typescript
// ❌ Плохо - N+1 запрос
const users = await this.prisma.user.findMany()
for (const user of users) {
	user.posts = await this.prisma.post.findMany({
		where: { userId: user.id },
	})
}

// ✅ Хорошо - один запрос
const users = await this.prisma.user.findMany({
	include: { posts: true },
})
```

### 6. Используйте индексы для производительности

```prisma
model User {
  id    String @id @default(cuid())
  email String @unique
  name  String

  @@index([name]) // Индекс для быстрого поиска по имени
}
```

## Типы ошибок Prisma

| Код   | Описание                         |
| ----- | -------------------------------- |
| P2002 | Unique constraint violation      |
| P2025 | Record not found                 |
| P2003 | Foreign key constraint violation |
| P2016 | Query interpretation error       |

## Полезные ссылки

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma with NestJS](https://docs.nestjs.com/recipes/prisma)
