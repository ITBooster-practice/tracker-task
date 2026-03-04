# Unit-тесты

Тесты изолированы от БД и внешних сервисов — все зависимости мокируются.

## Структура файлов

```
test/
├── mocks/
│   └── argon2.ts          # vi.fn() заглушки для hash / verify
├── helpers/
│   └── auth.helpers.ts    # Фабрики: createPrismaMock, createJwtMock, createConfigMock, makeTokens
└── unit/
    └── auth/
        └── auth.service.spec.ts
```

`mocks/` и `helpers/` расположены на уровне `test/` — доступны как unit, так и e2e тестам.

## Соглашения

- **Фикстуры** (`REGISTER_DTO`, `STORED_USER` и т.д.) — константы в верхней части spec-файла.
- **Сброс моков** — `vi.clearAllMocks()` в `beforeEach`, после чего явно восстанавливается нужная реализация (например, `hash`).
- **Мок argon2** подключается через `vi.mock('argon2', async () => await import('../../mocks/argon2'))`.

## Покрытые сценарии: AuthService

| Метод      | Сценарий           | Ожидание             |
| ---------- | ------------------ | -------------------- |
| `register` | Новый пользователь | Токены + запись в БД |
| `register` | Email уже занят    | `ConflictException`  |
| `login`    | Верные данные      | Токены               |
| `login`    | Email не найден    | `NotFoundException`  |
| `login`    | Неверный пароль    | `NotFoundException`  |
