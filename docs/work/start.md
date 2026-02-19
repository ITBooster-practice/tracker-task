# Быстрый старт проекта

## Предварительные требования

- Node.js >= 22
- pnpm >= 10.29.3
- Docker и Docker Compose (для Redis)
- PostgreSQL >= 17+
- pgAdmin (для управления PostgreSQL)

## Установка и запуск

### 1. Получить последние изменения

```bash
git pull origin main
```

Если работаешь в ветке:

```bash
git fetch origin
git pull origin <название-ветки>
```

### 2. Установить зависимости

```bash
pnpm install
```

### 3. Настройка переменных окружения

Скопируйте файлы окружения:

```bash
# Для API
cp apps/api/.env.example apps/api/.env

# Для Web
cp apps/web/.env.example apps/web/.env
```

Отредактируйте `.env` файлы согласно вашим настройкам.

**Пример `apps/api/.env`:**

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
```

### 4. Настроить базу данных

#### Первый раз: Настройка pgAdmin

1. **Открыть [pgAdmin](https://www.pgadmin.org/)**

2. **Создать подключение к серверу PostgreSQL:**
   - Правый клик на "Servers" → Register → Server
   - Вкладка General:
     - Name: `Local PostgreSQL` (или любое имя)
   - Вкладка Connection:
     - Host: `localhost`
     - Port: `5432`
     - Username: `postgres`
     - Password: (твой пароль от PostgreSQL)
   - Save

3. **Создать базу данных:**
   - Раскрыть сервер → правый клик на Databases → Create → Database
   - Database: `tracker-task`
   - Owner: `postgres`
   - Save

4. **Проверить подключение:**
   - Выбрать БД `tracker-task`
   - правый клик на `tracker-task` → Query Tool
   - Выполнить: `SELECT 1;` (F5)
   - Если вернулось `1` - всё работает ✅

### 5. Запустить Redis через Docker

```bash
pnpm docker:redis-up
```

Проверить статус:

```bash
pnpm docker:redis-status
```

### 6. Настройка Prisma

```bash
# Применение миграций (обязательно при первом запуске)
pnpm prisma:migrate

# (Опционально) Открыть Prisma Studio для просмотра данных
pnpm prisma:studio
```

> **Примечание:** `prisma:generate` запустится автоматически при `pnpm dev`, но миграции нужно применить вручную.

### 7. Запустить проект в dev-режиме

#### Backend (API)

```bash
pnpm --filter api dev
```

#### Frontend (Web)

```bash
pnpm --filter web dev
```

#### Всё сразу

```bash
pnpm dev
```

Приложение будет доступно:

- Frontend (Web): http://localhost:3000
- Backend (API): http://localhost:4000

## Полезные команды

### Разработка

```bash
pnpm dev              # Запуск всех приложений в dev режиме
pnpm build            # Сборка всех приложений
pnpm lint             # Проверка кода линтером
pnpm format           # Форматирование кода
pnpm type-check       # Проверка типов TypeScript
```

### Тестирование

```bash
pnpm test             # Запуск юнит-тестов
pnpm test:e2e         # Запуск E2E тестов
```

### Prisma

```bash
pnpm prisma:generate  # Генерация Prisma Client
pnpm prisma:migrate   # Создание и применение миграций
pnpm prisma:studio    # Открыть Prisma Studio
```

### Docker

```bash
pnpm docker:redis-up       # Запуск Redis
pnpm docker:redis-status   # Проверка статуса Redis
pnpm docker:redis-down     # Остановка Redis
```

## Структура проекта

```
tracker-task/
├── apps/
│   ├── api/          # Backend API (NestJS + Prisma)
│   └── web/          # Frontend (Next.js)
├── packages/
│   ├── api/          # Shared API types
│   ├── eslint-config/
│   ├── typescript-config/
│   ├── ui/           # Shared UI components
│   └── vitest-config/
└── docs/             # Документация
```

## Troubleshooting

### Проблемы с базой данных

Если возникают проблемы с подключением к БД:

1. Проверьте `DATABASE_URL` в `apps/api/.env`
2. Убедитесь, что PostgreSQL запущен
3. Попробуйте пересоздать миграции:
   ```bash
   pnpm prisma:migrate
   ```

### Проблемы с Redis

```bash
# Перезапуск Redis
pnpm docker:redis-down
pnpm docker:redis-up
```

### Проблемы с зависимостями

```bash
# Очистка и переустановка
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

## Дополнительная информация

- [Работа с Git](./git.md)
- [Общие соглашения](./common.md)
- [Документация Prisma](../prisma/README.md)
<!-- - [Документация Backend](../backend/README.md)
- [Документация Frontend](../frontend/README.md) -->

---

💡 **Совет**: Держи Redis и PostgreSQL запущенными в фоне, чтобы не перезапускать каждый раз.
