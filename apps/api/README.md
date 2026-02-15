# API (Tracker Task)

REST API сервер построен на **NestJS** с использованием TypeScript.

## Запуск

```bash
pnpm dev
```

API будет доступен по адресу [localhost:3000](http://localhost:3000)

## Архитектура приложения

```
main.ts → AppModule → LinksModule
             ↓           ↓
        AppController  LinksController
             ↓           ↓
         AppService   LinksService
```

**Принцип работы:**

- **main.ts** — точка входа, создает приложение и запускает сервер
- **Module** — объединяет контроллеры и сервисы
- **Controller** — принимает HTTP запросы (endpoints)
- **Service** — содержит бизнес-логику

## Структура API

```
src/
├── main.ts              # Точка входа, запуск сервера на :3000
├── app.module.ts        # Корневой модуль приложения
├── app.controller.ts    # Demo endpoint (GET /)
├── app.service.ts       # Demo логика
└── links/               # Пример модуля
    ├── links.module.ts       # Модуль для работы со ссылками
    ├── links.controller.ts   # HTTP endpoints (CRUD)
    ├── links.service.ts      # Бизнес-логика (пока моки)
    ├── links.controller.spec.ts  # Unit тесты
    └── links.service.spec.ts     # Unit тесты

test/
└── app.e2e-spec.ts      # E2E тесты

vitest.config.ts         # Конфигурация unit-тестов
vitest.config.e2e.ts     # Конфигурация e2e-тестов
```

## Доступные endpoints

### Demo

- `GET /` — Hello World

### Links (пример CRUD)

- `GET /links` — получить все ссылки
- `GET /links/:id` — получить одну ссылку
- `POST /links` — создать ссылку
- `PATCH /links/:id` — обновить ссылку
- `DELETE /links/:id` — удалить ссылку

## Тестирование

```bash
# Unit тесты
pnpm test

# E2E тесты
pnpm test:e2e

# С UI
pnpm test:ui
```

## ✅ Текущая структура

- ✅ **main.ts** — точка входа
- ✅ **app.module.ts** — корневой модуль
- ✅ **links/** — пример модуля (использует моки)
- ✅ **test/** — E2E тесты
- ✅ **vitest.config.ts** — конфигурация тестов

## 🚧 Следующие шаги

1. **Добавить базу данных** (PostgreSQL + Prisma)
2. **Заменить моки** в LinksService на реальные запросы к БД
3. **Создать модули** для основных сущностей:
   - Projects (проекты)
   - Issues (задачи)
   - Sprints (спринты)
   - Users (пользователи)
4. **Добавить аутентификацию** (JWT)
5. **Удалить** AppController/AppService или переделать в HealthCheck

## Разработка

- API автоматически перезагружается при изменении кода
- Используйте [Postman](https://www.postman.com/) для тестирования endpoints
- Перед сборкой проекта убедитесь, что скомпилированы `packages/*`
