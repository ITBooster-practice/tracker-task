# Тестирование Backend

## Содержание

- [Unit-тесты](./unit-tests.md) — изолированное тестирование сервисов
- [E2E тест подключения Prisma](./e2e-connection-test.md) — проверка соединения с БД

## Структура

```
apps/api/test/
├── mocks/                 # Общие моки (argon2 и др.)
├── helpers/               # Фабрики моков и фикстуры
├── unit/
│   └── auth/
│       └── auth.service.spec.ts
└── e2e/
    └── prisma-connection.e2e-spec.ts
```

## Команды

```bash
pnpm test              # unit-тесты + coverage
pnpm test:e2e          # e2e (требует запущенную БД)
pnpm test:watch        # watch-режим
```
