# Тестирование Backend

## Содержание

- [Unit-тесты](./unit-tests.md) — изолированное тестирование сервисов
- [E2E тест подключения Prisma](./e2e-connection-test.md) — проверка соединения с БД

## Структура

```
apps/api/test/
├── mocks/
│   └── argon2.ts              # vi.fn() заглушки для hash / verify
├── helpers/
│   └── auth.helpers.ts        # Фабрики: createPrismaMock, createJwtMock,
│                              #          createConfigMock, makeTokens
├── unit/
│   └── auth/
│       └── auth.service.spec.ts
└── e2e/
    └── prisma-connection.e2e-spec.ts
```

## Команды

```bash
# unit-тесты + coverage
pnpm test

# e2e (требует запущенную БД)
pnpm test:e2e

# watch-режим для разработки
pnpm test:watch
```

## Конфигурация

- `vitest.config.ts` — конфиг для unit-тестов
- `vitest.config.e2e.ts` — конфиг для e2e (include: `test/e2e/**`)
- `vitest.setup.ts` — глобальные настройки Vitest
