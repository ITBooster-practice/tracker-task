# Prisma ORM

## Установка

```bash
cd apps/api
pnpm add -D prisma @types/pg
pnpm add @prisma/client @prisma/adapter-pg pg dotenv
```

## Структура файлов

```
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
# Создать и применить миграцию
pnpm prisma:migrate -- --name <name>

# Применить существующие миграции (CI / prod)
pnpm prisma:deploy

# Сгенерировать Prisma Client
pnpm prisma:generate

# Открыть Prisma Studio
pnpm prisma:studio

# Заполнить БД тестовыми данными
pnpm prisma:seed
```
