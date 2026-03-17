# Swagger API Документация

## Быстрый старт

| URL                                | Описание     |
| ---------------------------------- | ------------ |
| http://localhost:3000/api/docs     | Swagger UI   |
| http://localhost:3000/swagger.json | OpenAPI JSON |
| http://localhost:3000/swagger.yaml | OpenAPI YAML |

## Установка зависимостей

```bash
cd apps/api
pnpm add @nestjs/swagger nestjs-zod
```

## Архитектура Swagger

Swagger разбит на два файла:

```
src/
├── utils/swagger.util.ts       # setupSwagger(app) — вызывается в main.ts
└── auth/config/swagger.config.ts  # getSwaggerConfig() — DocumentBuilder
```

### `swagger.config.ts`

```typescript
import { DocumentBuilder } from '@nestjs/swagger'

export function getSwaggerConfig() {
	return new DocumentBuilder()
		.setTitle('Tracker Task API')
		.setDescription('API для управления проектами и задачами')
		.setVersion('1.0.0')
		.addBearerAuth() // Включает поле для JWT в Swagger UI
		.build()
}
```

### `swagger.util.ts`

```typescript
import { SwaggerModule } from '@nestjs/swagger'
import { cleanupOpenApiDoc } from 'nestjs-zod'
import { getSwaggerConfig } from 'src/auth/config/swagger.config'

export function setupSwagger(app: INestApplication) {
	const config = getSwaggerConfig()
	const document = SwaggerModule.createDocument(app, config)
	SwaggerModule.setup('api/docs', app, cleanupOpenApiDoc(document), {
		jsonDocumentUrl: '/swagger.json',
		yamlDocumentUrl: '/swagger.yaml',
		swaggerOptions: { withCredentials: true }, // Передаёт cookie (refreshToken)
	})
}
```

### `main.ts`

```typescript
import { setupSwagger } from './utils/swagger.util'

const app = await NestFactory.create(AppModule)
setupSwagger(app)
```

## Интеграция с Zod (nestjs-zod)

DTO-классы наследуются от `createZodDto()` — схемы генерируются автоматически.

```typescript
// packages/types/src/auth/...
export const registerRequestSchema = z.object({
	name: z.string(),
	email: z.email({ error: 'Email некорректный' }),
	password: z.string().min(6, { message: 'Минимум 6 символов' }),
})

// apps/api/src/auth/dto/register.dto.ts
export class RegisterRequestDto extends createZodDto(registerRequestSchema) {
	@ApiProperty({ example: 'Иван Иванов' }) name: string
	@ApiProperty({ example: 'user@example.com' }) email: string
	@ApiProperty({ example: '123456' }) password: string
}
```

**Важно:** `cleanupOpenApiDoc(document)` — обязательно, без него Zod-схемы
не корректно отображаются в Swagger UI.

## Документирование эндпоинтов

```typescript
@ApiTags('Auth')
@Controller('auth')
export class AuthController {

    @ApiOperation({ summary: 'Регистрация аккаунта' })
    @ApiOkResponse({ type: AuthResponse })
    @ApiConflictResponse({ description: 'Email уже занят' })
    @ApiBadRequestResponse({ description: 'Ошибка валидации' })
    @Post('register')
    async register(@Body() dto: RegisterRequestDto) { ... }

    // Защищённый маршрут — кнопка Authorize в UI
    @Authorization()
    @ApiBearerAuth()
    @Get('me')
    async me(@Authorized() user: User) { ... }
}
```

### Декораторы ответов

| Декоратор                  | HTTP код | Когда использовать     |
| -------------------------- | -------- | ---------------------- |
| `@ApiOkResponse`           | 200      | Успешный ответ         |
| `@ApiCreatedResponse`      | 201      | Ресурс создан          |
| `@ApiBadRequestResponse`   | 400      | Ошибка валидации       |
| `@ApiUnauthorizedResponse` | 401      | Не авторизован         |
| `@ApiNotFoundResponse`     | 404      | Ресурс не найден       |
| `@ApiConflictResponse`     | 409      | Конфликт (дубль email) |

## AuthResponse DTO

```typescript
// src/auth/dto/auth.dto.ts
export class AuthResponse {
	@ApiProperty({ description: 'JWT access токен', example: 'eyJ...' })
	accessToken: string
}
```

`refreshToken` не возвращается в теле — он устанавливается как HTTP-only cookie.
