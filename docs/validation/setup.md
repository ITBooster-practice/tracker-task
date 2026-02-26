# Настройка валидации (Step-by-Step)

## Обзор

Пошаговая инструкция по настройке валидации в проекте с нуля.

## Шаг 1: Установка зависимостей

### Backend (apps/api)

```bash
cd apps/api
pnpm add nestjs-zod zod
```

### Общий пакет (packages/api)

```bash
cd packages/api
pnpm add zod
```

## Шаг 2: Создание Zod схемы

**Файл:** `packages/api/src/auth/dto/register.dto.ts`

```typescript
import { z } from 'zod'

export const registerRequestSchema = z.object({
	name: z
		.string({ message: 'Имя должно быть строкой' })
		.max(50, { message: 'Макс 50 символов' })
		.optional(),
	email: z.email({ error: 'Email некорректный' }),
	password: z
		.string({ message: 'Пароль должен быть строкой' })
		.min(6, { message: 'Минимум 6 символов' })
		.max(128, { message: 'Максимум 128 символов' }),
})

export type RegisterRequest = z.infer<typeof registerRequestSchema>
```

**Экспорт:** `packages/api/src/entry.ts`

```typescript
export { registerRequestSchema } from './auth/dto/register.dto'
export type { RegisterRequest } from './auth/dto/register.dto'
```

## Шаг 3: Создание DTO класса для NestJS

**Файл:** `apps/api/src/auth/dto/register.dto.ts`

```typescript
import { createZodDto } from 'nestjs-zod'

import { registerRequestSchema } from '@repo/api'

export class RegisterRequestDto extends createZodDto(registerRequestSchema) {}
```

## Шаг 4: Кастомный ValidationPipe

**Файл:** `apps/api/src/common/providers/zod-validation.provider.ts`

```typescript
import { BadRequestException } from '@nestjs/common'
import { createZodValidationPipe } from 'nestjs-zod'

export const CustomZodValidationPipe = createZodValidationPipe({
	createValidationException: (error: any) => {
		const zodError = error as any
		const errors = zodError.issues

		const paths = errors.map((err: any) => err.path.join('.'))
		const messages = errors.map((err: any) => err.message)

		return new BadRequestException({
			statusCode: 400,
			path: paths,
			message: messages,
		})
	},
})
```

## Шаг 5: Регистрация в AppModule

**Файл:** `apps/api/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common'
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

## Шаг 6: Настройка Swagger

**Файл:** `apps/api/src/main.ts`

```typescript
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { cleanupOpenApiDoc } from 'nestjs-zod'

const config = new DocumentBuilder().setTitle('API').setVersion('1.0').build()

const document = SwaggerModule.createDocument(app, config)
SwaggerModule.setup('api/docs', app, cleanupOpenApiDoc(document))
```

## Шаг 7: Использование в контроллере

**Файл:** `apps/api/src/auth/auth.controller.ts`

```typescript
import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { RegisterRequestDto } from './dto/register.dto'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
	@Post('register')
	@ApiOperation({ summary: 'Регистрация' })
	@ApiResponse({ status: 201, description: 'Успех' })
	@ApiResponse({ status: 400, description: 'Ошибка валидации' })
	async register(@Body() dto: RegisterRequestDto) {
		// dto уже провалидирован автоматически
		return this.authService.register(dto)
	}
}
```

## Готово!

Теперь:

- ✅ Валидация работает автоматически
- ✅ Swagger генерирует схемы из Zod
- ✅ Кастомный формат ошибок
- ✅ Общий код для frontend/backend

## Документация

- [Общая валидация](../validation/README.md)
- [Backend валидация](../backend/validation/README.md)
- [Swagger](../backend/swagger/README.md)
