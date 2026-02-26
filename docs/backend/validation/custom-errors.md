# Кастомные ошибки валидации

## Обзор

Проект использует кастомный формат ошибок валидации для улучшения UX.

## Расположение

```
apps/api/src/common/providers/zod-validation.provider.ts
```

## Реализация

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

## Формат ответа

### Стандартный nestjs-zod (без кастомизации)

```json
{
	"statusCode": 400,
	"message": "Validation failed",
	"errors": [
		{
			"code": "invalid_string",
			"path": ["email"],
			"message": "Email некорректный"
		}
	]
}
```

### Наш кастомный формат

```json
{
	"statusCode": 400,
	"path": ["email", "password"],
	"message": ["Email некорректный", "Минимум 6 символов"]
}
```

## Преимущества

1. **Простота** - массивы легче обрабатывать на фронтенде
2. **Компактность** - меньше данных в ответе
3. **Соответствие** - индексы `path[i]` и `message[i]` совпадают

## Использование на фронтенде

```typescript
// Обработка ошибки
if (error.response.status === 400) {
	const { path, message } = error.response.data

	path.forEach((field, index) => {
		// Показать ошибку для поля
		setError(field, { message: message[index] })
	})
}
```

## Изменение формата

Чтобы изменить формат ошибок, отредактируйте:

```
apps/api/src/common/providers/zod-validation.provider.ts
```

Функция `createValidationException` принимает Zod ошибку и возвращает NestJS исключение.
