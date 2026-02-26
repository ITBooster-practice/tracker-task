# Backend Валидация (NestJS + Zod)

## 📚 Документация

- [Настройка валидации](../../validation/setup.md) - Полная инструкция
- [Кастомные ошибки](./custom-errors.md) - Формат ошибок
- [Общая валидация](../../validation/README.md) - Концепция Zod

---

## Обзор

Валидация на бекенде реализована через интеграцию **NestJS** и **nestjs-zod**.

## Установка

```bash
cd apps/api
pnpm add nestjs-zod zod
```

## Архитектура

```
packages/api/src/auth/dto/
  register.dto.ts          ← Zod схема (общая)

apps/api/src/
  app.module.ts            ← Регистрация валидации
  auth/dto/
    register.dto.ts        ← DTO класс для NestJS
  common/providers/
    zod-validation.provider.ts  ← Кастомный pipe
```

## Настройка

### 1. Создание схемы (packages/api)

```typescript
// packages/api/src/auth/dto/register.dto.ts
import { z } from 'zod'

export const registerRequestSchema = z.object({
	email: z.email({ error: 'Email некорректный' }),
	password: z
		.string({ message: 'Пароль должен быть строкой' })
		.min(6, { message: 'Минимум 6 символов' }),
})

export type RegisterRequest = z.infer<typeof registerRequestSchema>
```

### 2. Создание DTO класса (apps/api)

```typescript
// apps/api/src/auth/dto/register.dto.ts
import { createZodDto } from 'nestjs-zod'

import { registerRequestSchema } from '@repo/api'

export class RegisterRequestDto extends createZodDto(registerRequestSchema) {}
```

### 3. Использование в контроллере

```typescript
@Post('register')
async register(@Body() dto: RegisterRequestDto) {
  // dto уже провалидирован автоматически!
  return this.authService.register(dto)
}
```

### 4. Регистрация глобально (app.module.ts)

```typescript
import { CustomZodValidationPipe } from './common/providers/zod-validation.provider'

@Module({
	providers: [
		{ provide: APP_PIPE, useClass: CustomZodValidationPipe },
		{ provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
	],
})
export class AppModule {}
```

## Формат ошибок

### Запрос с ошибками

```json
POST /auth/register
{
  "email": "invalid",
  "password": "123"
}
```

### Ответ

```json
{
	"statusCode": 400,
	"path": ["email", "password"],
	"message": ["Email некорректный", "Минимум 6 символов"]
}
```

## Кастомизация

Кастомный формат ошибок настраивается в:

```
apps/api/src/common/providers/zod-validation.provider.ts
```

Подробнее: [custom-errors.md](./custom-errors.md)

## Интеграция со Swagger

DTO классы автоматически генерируют OpenAPI схемы.

Подробнее: [../swagger/README.md](../swagger/README.md)

## Полезные ссылки

- [nestjs-zod документация](https://github.com/risenforces/nestjs-zod)
- [Общая валидация](../../validation/README.md)
