# Backend Документация

## Содержание

### Валидация

- [Валидация данных](./validation/README.md) - NestJS + Zod
- [Кастомные ошибки](./validation/custom-errors.md) — Формат ошибок

### API

- [Swagger](./swagger/README.md) — API документация

### База данных

- [Prisma](./prisma/README.md) — ORM и миграции

### Тестирование

- [Обзор](./test/README.md) — Структура, команды
- [Unit-тесты](./test/unit-tests.md) — AuthService: register, login
- [E2E тест Prisma](./test/e2e-connection-test.md) — Проверка соединения с БД

---

## Быстрый старт

1. **Настройка валидации** — [validation/setup](../validation/setup.md)
2. **Swagger** — http://localhost:4000/api/docs
3. **Prisma Studio** — `pnpm prisma:studio`

## Реализованные эндпоинты

Актуальный список с описанием запросов/ответов — в Swagger: http://localhost:4000/api/docs

### Аутентификация (JWT + Cookie)

- `accessToken` — Bearer-токен, передаётся в `Authorization: Bearer <token>`
- `refreshToken` — HTTP-only cookie, управляется сервером автоматически
- Защищённые маршруты: декоратор `@Authorization()` (= `@UseGuards(JwtGuard)`)
- `@Authorized()` — param-декоратор для получения объекта пользователя из запроса

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
    ├── common/providers/
    │   └── zod-validation.provider.ts  # Кастомный ValidationPipe
    ├── guards/
    │   └── auth.guard.ts       # JwtGuard extends AuthGuard('jwt')
    ├── strategies/
    │   └── jwt.strategy.ts     # PassportStrategy -> validateUser
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
| API Docs   | @nestjs/swagger                               |
| Testing    | Vitest                                        |
