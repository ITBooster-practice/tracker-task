# Backend Валидация (NestJS + Zod)

## Документация

- [Настройка валидации](../../validation/setup.md) — полная инструкция
- [Кастомные ошибки](./custom-errors.md) — формат ответов 400
- [Общая валидация](../../validation/README.md) — концепция Zod

---

## Архитектура

```
packages/types/src/auth/
  register.dto.ts          # Zod-схема (общая, используется везде)
  login.dto.ts

apps/api/src/
  app.module.ts            # Регистрация CustomZodValidationPipe глобально
  auth/dto/
    register.dto.ts        # DTO класс NestJS (createZodDto + @ApiProperty)
    login.dto.ts
  common/providers/
    zod-validation.provider.ts  # Кастомный pipe (кастомный формат ошибок)
```

## Установка

```bash
cd apps/api
pnpm add nestjs-zod zod
```

## Шаг 1: Zod-схема в `packages/types`

```typescript
// packages/types/src/auth/register.dto.ts
import { z } from 'zod'

export const registerRequestSchema = z.object({
	name: z.string({ message: 'Имя должно быть строкой' }),
	email: z.email({ error: 'Email некорректный' }),
	password: z.string().min(6, { message: 'Минимум 6 символов' }),
})

export type RegisterRequest = z.infer<typeof registerRequestSchema>
```

## Шаг 2: DTO класс в `apps/api`

```typescript
// apps/api/src/auth/dto/register.dto.ts
import { createZodDto } from 'nestjs-zod'
import { ApiProperty } from '@nestjs/swagger'
import { registerRequestSchema } from '@repo/types'

export class RegisterRequestDto extends createZodDto(registerRequestSchema) {
	@ApiProperty({ example: 'Иван Иванов' }) name: string
	@ApiProperty({ example: 'user@example.com' }) email: string
	@ApiProperty({ example: '123456' }) password: string
}
```

## Шаг 3: Кастомный pipe (CustomZodValidationPipe)

```typescript
// apps/api/src/common/providers/zod-validation.provider.ts
import { BadRequestException } from '@nestjs/common'
import { createZodValidationPipe } from 'nestjs-zod'

export const CustomZodValidationPipe = createZodValidationPipe({
	createValidationException: (error) => {
		const paths = error.issues.map((e) => e.path.join('.'))
		const messages = error.issues.map((e) => e.message)
		return new BadRequestException({ statusCode: 400, path: paths, message: messages })
	},
})
```

## Шаг 4: Регистрация в `app.module.ts`

```typescript
import { APP_PIPE, APP_INTERCEPTOR } from '@nestjs/core'
import { ZodSerializerInterceptor } from 'nestjs-zod'
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

```json
{
	"statusCode": 400,
	"path": ["email", "password"],
	"message": ["Email некорректный", "Минимум 6 символов"]
}
```

Индексы `path[i]` и `message[i]` всегда соответствуют друг другу.
