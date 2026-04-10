# Тестирование Backend

## Содержание

- [Как писать тесты](./how-to-write-tests.md) — структура, хелперы, конфиг, соглашения
- [Unit-тесты](./unit-tests.md) — покрытые сценарии по сервисам
- [E2E-тесты](./e2e-tests.md) — покрытые сценарии по эндпоинтам

## Структура

```
apps/api/test/
├── mocks/
│   └── argon2.ts                        # vi.fn() заглушки для hash/verify
├── helpers/
│   ├── auth.helpers.ts                  # createPrismaMock, createJwtMock, createConfigMock, makeTokens
│   ├── teams.helpers.ts                 # createPrismaMock, TEAM, MEMBER_OWNER/ADMIN/PLAIN, USER_ID, TEAM_ID
│   ├── invitations.helpers.ts           # mocks и фикстуры для invitations service
│   └── e2e.helpers.ts                   # createTestApp, registerAndLogin
├── unit/
│   ├── app.controller.spec.ts
│   ├── auth/
│   │   └── auth.service.spec.ts
│   └── teams/
│       ├── teams.service.spec.ts
│       ├── team-members.service.spec.ts
│       └── team-invitations.service.spec.ts
└── e2e/
    ├── prisma-connection.e2e-spec.ts
    ├── auth.e2e-spec.ts
    ├── teams.e2e-spec.ts
    ├── team-members.e2e-spec.ts
    └── invitations.e2e-spec.ts
```

## Команды

```bash
# unit-тесты + coverage
pnpm test

# e2e (требует запущенный Docker с БД и Redis)
pnpm test:e2e

# watch-режим
pnpm test:watch
```

## Конфигурация

| Файл                   | Назначение                  |
| ---------------------- | --------------------------- |
| `vitest.config.ts`     | unit-тесты (`test/unit/**`) |
| `vitest.config.e2e.ts` | e2e-тесты (`test/e2e/**`)   |
| `vitest.setup.ts`      | глобальные настройки Vitest |
