# Prisma ORM

## Установка

```bash
cd apps/api
pnpm add -D prisma @types/pg
pnpm add @prisma/client @prisma/adapter-pg pg dotenv
```

## Структура файлов

```text
apps/api/
├── prisma/
│   ├── schema.prisma         # Схема БД
│   ├── prisma.service.ts     # PrismaService с адаптером pg
│   ├── prisma.module.ts      # Глобальный NestJS-модуль
│   ├── seed.ts               # Сидирование
│   └── migrations/           # Миграции
├── prisma.config.ts          # Конфиг Prisma 7.x (с URL)
└── generated/
    └── prisma/               # Сгенерированный Prisma Client
```

## Конфигурация Prisma 7.x

### `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client"   // Новый генератор Prisma 7
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
  // URL не указывается здесь — он в prisma.config.ts
}
```

### `prisma.config.ts`

```typescript
import 'dotenv/config'

import { defineConfig } from 'prisma/config'

export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: { path: 'prisma/migrations' },
	datasource: { url: process.env['DATABASE_URL'] },
})
```

## Модели

### User

```prisma
model User {
  id              String    @id @default(uuid())
  email           String    @unique
  name            String?
  password        String
  createdProjects Project[]
  assignedTasks   Task[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### Project

```prisma
model Project {
  id          String   @id @default(uuid())
  name        String
  description String?
  createdById String
  createdBy   User     @relation(fields: [createdById], references: [id])
  tasks       Task[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Task

```prisma
model Task {
  id          String     @id @default(uuid())
  title       String
  description String?
  status      TaskStatus @default(TODO)
  priority    Priority   @default(MEDIUM)
  projectId   String
  project     Project    @relation(fields: [projectId], references: [id])
  assigneeId  String?
  assignee    User?      @relation(fields: [assigneeId], references: [id])
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}
```

### Перечисления (enum)

```prisma
enum TaskStatus { TODO  IN_PROGRESS  IN_REVIEW  DONE }
enum Priority   { LOW   MEDIUM       HIGH       CRITICAL }
```

## PrismaService

```typescript
// prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '../../generated/prisma'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
	async onModuleInit() {
		await this.$connect()
	}
	async onModuleDestroy() {
		await this.$disconnect()
	}
}
```

## Команды

```bash
# Создать миграцию схемы и применить её локально
pnpm prisma:migrate -- --name <name>

# Применить схему к уже существующей БД без потери данных
pnpm prisma:db:update

# Сгенерировать Prisma Client
pnpm prisma:generate

# Открыть Prisma Studio
pnpm prisma:studio

# Заполнить БД тестовыми данными
pnpm prisma:seed
```

## Обновление существующей БД без потери данных

Prisma в этом проекте используется так:

1. `pnpm prisma:migrate` - для разработки новых изменений схемы.
2. `pnpm prisma:db:update` - для применения уже готовых миграций к существующей БД на dev / stage / prod.
3. Данные, нужные для совместимости со старой историей, должны заполняться в миграции через backfill SQL или отдельный data-migration шаг, а не через массовый seed.

Правило для обязательных колонок и новых связей:

1. Сначала добавить колонку как nullable.
2. Заполнить существующие строки.
3. Только потом сделать колонку `NOT NULL` и добавить или усилить внешний ключ.

Если преобразование нельзя выразить одной SQL-миграцией, его нужно выделять в отдельный явно названный data-migration шаг и запускать его контролируемо в CI/CD, а не через общий seed.

### Несовместимые изменения схемы

Старый API может не подходить новой схеме БД. В таком случае сначала соберите новый образ, затем остановите старый API, примените миграции временным контейнером и запускайте новый API только после их успешного завершения.

Пример для локального Docker-стека: выполняйте команды из корня проекта. До обновления сохраните резервную копию БД; PostgreSQL должен быть запущен, а подключение к нему — настроено для сервиса `api`. На время миграций остановите также другие процессы, которые записывают данные в эту БД.

```bash
# Собрать образ с новым кодом и файлами миграций
docker compose -f docker-compose.local.yml build api

# Остановить API со старым кодом
docker compose -f docker-compose.local.yml stop api

# Применить миграции из нового образа и удалить временный контейнер
docker compose -f docker-compose.local.yml run --rm api node_modules/.bin/prisma migrate deploy --config prisma.config.mjs
```

Только если миграции завершились успешно, запустите API из нового образа:

```bash
docker compose -f docker-compose.local.yml up -d api
```

При ошибке миграции оставьте API остановленным и устраните причину. Сброс БД и seed не заменяют применение миграций.
