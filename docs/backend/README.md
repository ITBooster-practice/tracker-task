# Backend Документация

## Содержание

### Валидация

- [Валидация данных](./validation/README.md) - NestJS + Zod
- [Кастомные ошибки](./validation/custom-errors.md) — Формат ошибок

### API

- [Swagger](./swagger/README.md) — API документация
- [Teams](./teams/README.md) — Команды, участники, приглашения, роли

### База данных

- [Prisma](./prisma/README.md) — ORM и миграции

### Кеш и хранилище

- [Redis](./redis/README.md) — Хранение refresh-токенов с TTL, отладка

### Тестирование

- [Обзор](./test/README.md) — Структура, команды
- [Unit-тесты](./test/unit-tests.md) — AuthService: register, login
- [E2E-тесты](./test/e2e-tests.md) — Auth, Teams, TeamMembers, Invitations

### Инфраструктура

- [Mail](./mail.md) — Отправка писем и шаблоны
- [Schedule](./schedule.md) — Шпаргалка по `@nestjs/schedule`

---

## Быстрый старт

1. **Запустить Redis** — `pnpm docker:redis-up`
2. **Настройка валидации** — [validation/setup](../validation/setup.md)
3. **Swagger** — http://localhost:3000/api/docs
4. **Prisma Studio** — `pnpm prisma:studio`

## Реализованные эндпоинты

Актуальный список с описанием запросов/ответов — в Swagger: http://localhost:3000/api/docs

### Аутентификация (JWT + Cookie)

- `accessToken` — Bearer-токен, передаётся в `Authorization: Bearer <token>`
- `refreshToken` — HTTP-only cookie, управляется сервером автоматически; хранится в Redis с TTL
- Защищённые маршруты: декоратор `@Authorization()` (= `@UseGuards(JwtGuard)`)
- `@Authorized()` — param-декоратор для получения объекта пользователя из запроса

### Команды и приглашения

- Реализованы команды: создание, просмотр, редактирование, удаление
- Реализовано управление участниками: список, смена роли, исключение, self-leave
- Реализованы приглашения в команду:
  - `POST /teams/:id/invitations`
  - `GET /teams/:id/invitations`
  - `DELETE /teams/:id/invitations/:invId`
  - `GET /invitations/me`
  - `POST /invitations/:token/accept`
  - `POST /invitations/:token/decline`
- Team-scoped invitations routes защищены через `@Authorization()` + `@Roles('OWNER', 'ADMIN')` + `RolesGuard`
- Входящие invitations routes защищены через `@Authorization()`

### Планировщик задач

- Для фоновых задач используется `@nestjs/schedule`
- `ScheduleModule.forRoot()` подключён в корневом модуле
- Каждые 6 часов cron-задача переводит просроченные `PENDING` invitations в `EXPIRED`

### Переменные окружения

См. `apps/api/.env.example` — все переменные описаны там.

## Структура Backend

```
apps/api/
├── prisma/
│   ├── schema.prisma         # Схема БД (User, Project, Task)
│   ├── prisma.service.ts     # PrismaService с адаптером pg
│   ├── prisma.module.ts      # Глобальный модуль
│   ├── seed.ts               # Сидирование БД
│   └── migrations/
├── prisma.config.ts          # Конфиг Prisma 7.x (URL через .env)
├── generated/prisma/         # Сгенерированный Prisma Client
└── src/
    ├── main.ts               # Точка входа (порт 4000)
    ├── app.module.ts         # Корневой модуль
    ├── auth/
    │   ├── auth.module.ts
    │   ├── auth.service.ts
    │   ├── auth.controller.ts
    │   ├── config/
    │   │   ├── jwt.config.ts       # JWT настройки (HS256)
    │   │   └── swagger.config.ts   # DocumentBuilder конфиг
    │   ├── decorators/
    │   │   ├── authorization.decorator.ts  # @Authorization()
    │   │   └── authorized.decorator.ts     # @Authorized()
    │   ├── dto/
    │   │   ├── register.dto.ts     # RegisterRequestDto
    │   │   ├── login.dto.ts        # LoginRequestDto
    │   │   └── auth.dto.ts         # AuthResponse
    │   └── interfaces/
    │       └── jwt.interface.ts    # JwtPayload { id }
    ├── common/
    │   ├── constants/
    │   │   ├── roles.constants.ts         # ROLES_KEY, TeamRole
    │   │   └── invitations.constants.ts   # TTL invitations, cron, error/log messages
    │   ├── providers/
    │   │   └── zod-validation.provider.ts  # Кастомный ValidationPipe
    │   └── redis/
    │       ├── redis.constants.ts  # REDIS_CLIENT токен
    │       ├── redis.module.ts     # @Global() модуль, создаёт ioredis-клиент
    │       └── redis.service.ts    # setRefreshToken / getRefreshToken / deleteRefreshToken
    ├── guards/
    │   ├── auth.guard.ts       # JwtGuard extends AuthGuard('jwt')
    │   └── roles.guard.ts      # Guard для OWNER / ADMIN на team-scoped routes
    ├── mail/
    │   ├── mail.module.ts
    │   ├── mail.service.ts
    │   └── templates/
    │       ├── welcome.email.tsx
    │       └── team-invitation.email.tsx
    ├── strategies/
    │   └── jwt.strategy.ts     # PassportStrategy -> validateUser
    ├── teams/
    │   ├── teams.module.ts
    │   ├── teams.controller.ts
    │   ├── teams.service.ts
    │   ├── invitations/
    │   │   ├── team-invitations.module.ts
    │   │   ├── team-invitations.controller.ts
    │   │   ├── invitations.controller.ts
    │   │   ├── team-invitations.service.ts
    │   │   └── dto/
    │   └── members/
    └── utils/
        ├── swagger.util.ts     # setupSwagger()
        ├── is-dev.util.ts      # isDev(configService)
        └── ms.util.ts          # parseTTLToMs()
```

## Технологии

| Область    | Стек                                          |
| ---------- | --------------------------------------------- |
| Framework  | NestJS                                        |
| Auth       | Passport + passport-jwt + @nestjs/jwt (HS256) |
| Passwords  | argon2                                        |
| Cookies    | cookie-parser                                 |
| Validation | Zod + nestjs-zod                              |
| Database   | PostgreSQL + Prisma 7.x                       |
| Cache      | Redis 7 + ioredis                             |
| API Docs   | @nestjs/swagger                               |
| Scheduling | @nestjs/schedule                              |
| Testing    | Vitest                                        |
