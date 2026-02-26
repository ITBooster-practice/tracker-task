# Swagger API Документация

## Быстрый старт

Swagger API документация доступна по адресу:

```
http://localhost:4000/api/docs
```

## Установка

Для установки Swagger в NestJS проекте используйте команду:

```bash
cd apps/api
pnpm add @nestjs/swagger nestjs-zod
```

или установить все зависимости проекта (установит только те которые ещё не установлены):

```bash
pnpm install
```

## Настройка

Swagger настраивается в файле `apps/api/src/main.ts`:

```typescript
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { cleanupOpenApiDoc } from 'nestjs-zod'

const config = new DocumentBuilder()
	.setTitle('Tracker Task API')
	.setDescription('API для управления проектами и задачами')
	.setVersion('1.0.0')
	.addBearerAuth()
	.build()

const document = SwaggerModule.createDocument(app, config)

// Очистка для корректной работы с Zod схемами
SwaggerModule.setup('api/docs', app, cleanupOpenApiDoc(document))
```

## Интеграция с Zod

### Автоматическая генерация схем

DTO классы, созданные через `createZodDto`, автоматически генерируют OpenAPI схемы:

```typescript
// packages/api/src/auth/dto/register.dto.ts
export const registerRequestSchema = z.object({
	email: z.email({ error: 'Email некорректный' }),
	password: z.string().min(6),
})

// apps/api/src/auth/dto/register.dto.ts
export class RegisterRequestDto extends createZodDto(registerRequestSchema) {}
```

Swagger автоматически покажет:

- Тип поля (`string`, `number`, и т.д.)
- Валидационные правила (`minLength`, `format: email`)
- Обязательность полей
- Примеры значений

### Документирование эндпоинтов

```typescript
@ApiTags('auth')
@Controller('auth')
export class AuthController {
	@Post('register')
	@ApiOperation({ summary: 'Регистрация нового пользователя' })
	@ApiResponse({ status: 201, description: 'Успешная регистрация' })
	@ApiResponse({ status: 400, description: 'Ошибка валидации' })
	async register(@Body() dto: RegisterRequestDto) {
		return this.authService.register(dto)
	}
}
```

### cleanupOpenApiDoc

**Важно!** Функция `cleanupOpenApiDoc` необходима для корректной работы Zod схем в Swagger:

```typescript
SwaggerModule.setup('api/docs', app, cleanupOpenApiDoc(document))
```

Без неё Swagger может показывать некорректные схемы.

## Что это дает?

- 📝 Автоматическая генерация документации из Zod схем
- 🧪 Возможность тестировать эндпоинты прямо из браузера
- 🔒 Поддержка Bearer Auth токенов
- 📊 Интерактивная документация с примерами запросов и ответов
- ✅ Синхронизация валидации и документации

## Полезные ссылки

- [Официальная документация NestJS Swagger](https://docs.nestjs.com/openapi/introduction)
- [nestjs-zod OpenAPI поддержка](https://github.com/risenforces/nestjs-zod#openapi-support-swagger)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [Валидация в проекте](../validation/README.md)
