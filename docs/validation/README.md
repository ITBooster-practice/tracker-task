# Валидация данных (Zod)

## 📚 Документация

- [Настройка валидации](./setup.md) - Пошаговая инструкция
- [Backend валидация](../backend/validation/README.md) - NestJS + Zod
- [Кастомные ошибки](../backend/validation/custom-errors.md) - Формат ошибок

---

## Обзор

В проекте используется **Zod v4** для валидации данных как на фронтенде, так и на бекенде.

## Почему Zod?

- ✅ **TypeScript-first** - автоматический вывод типов
- ✅ **Единая схема** - одна схема для валидации и типизации
- ✅ **Расшаряемые схемы** - используем один код на frontend и backend
- ✅ **Понятные ошибки** - кастомизируемые сообщения на русском

## Архитектура

```
packages/api/          ← Общие схемы Zod
  src/auth/dto/
    register.dto.ts    ← registerRequestSchema + тип

apps/api/              ← Backend использует схемы
  src/auth/dto/
    register.dto.ts    ← createZodDto(registerRequestSchema)

apps/web/              ← Frontend использует те же схемы
  features/auth/
    schema.ts          ← импорт registerRequestSchema
```

## Основные концепции

### 1. Создание схемы

```typescript
import { z } from 'zod'

export const registerRequestSchema = z.object({
	email: z.email({ error: 'Email некорректный' }),
	password: z
		.string({ message: 'Пароль должен быть строкой' })
		.min(6, { message: 'Минимум 6 символов' }),
})

export type RegisterRequest = z.infer<typeof registerRequestSchema>
```

### 2. Валидация данных

```typescript
// Backend - автоматически через ZodValidationPipe
// Frontend - вручную
const result = registerRequestSchema.safeParse(data)

if (!result.success) {
	console.log(result.error.issues) // Массив ошибок
}
```

### 3. Типизация

```typescript
// TypeScript тип автоматически выводится
type RegisterRequest = z.infer<typeof registerRequestSchema>
```

## Zod v4 особенности

### Новый синтаксис

```typescript
// ✅ Zod v4
z.email({ error: 'Некорректный email' })

// ❌ Zod v3 (устарело)
z.string().email({ message: 'Некорректный email' })
```

### Встроенная поддержка OpenAPI

Zod v4 имеет встроенный `.toJSONSchema()` для автоматической генерации OpenAPI документации.

## Документация по частям

- [Backend Validation](../backend/validation/README.md) - Настройка на NestJS
- Frontend Validation _(TODO)_ - Использование в React формах

## Полезные ссылки

- [Zod Documentation](https://zod.dev)
- [Zod v4 Migration Guide](https://github.com/colinhacks/zod/releases)
