# Backend Документация

## 📚 Содержание

### Валидация

- [Валидация данных](./validation/README.md) - NestJS + Zod
- [Кастомные ошибки](./validation/custom-errors.md) - Формат ошибок

### API

- [Swagger](./swagger/README.md) - API документация

### База данных

- [Prisma](./prisma/README.md) - ORM и миграции

### Тестирование

- [E2E тесты](./test/e2e-connection-test.md) - Интеграционные тесты

---

## Быстрый старт

1. **Настройка валидации** - [validation/setup](../validation/setup.md)
2. **Swagger документация** - http://localhost:4000/api/docs
3. **Prisma Studio** - `pnpm prisma:studio`

## Структура Backend

```
apps/api/src/
  ├── auth/              # Аутентификация
  ├── common/            # Общие провайдеры и утилиты
  │   └── providers/
  │       └── zod-validation.provider.ts
  ├── app.module.ts      # Главный модуль
  └── main.ts            # Точка входа

apps/api/prisma/
  ├── schema.prisma      # Схема БД
  └── migrations/        # Миграции
```

## Технологии

- **Framework**: NestJS
- **Validation**: Zod + nestjs-zod
- **Database**: PostgreSQL + Prisma
- **API Docs**: Swagger
- **Testing**: Vitest
