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
pnpm add @nestjs/swagger
```

или установить все зависимости проекта(установит только те которые ещё не установлены):

```bash
pnpm install
```

## Настройка

Swagger настраивается в файле `apps/api/src/main.ts`:

```typescript
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

const config = new DocumentBuilder()
	.setTitle('Tracker Task API')
	.setDescription('API для управления проектами и задачами')
	.setVersion('1.0.0')
	.addBearerAuth()
	.build()

const document = SwaggerModule.createDocument(app, config)
SwaggerModule.setup('api/docs', app, document)
```

## Что это дает?

- 📝 Автоматическая генерация документации API
- 🧪 Возможность тестировать эндпоинты прямо из браузера
- 🔒 Поддержка Bearer Auth токенов
- 📊 Интеактивная документация с примерами запросов и ответов

## Полезные ссылки

- [Официальная документация NestJS Swagger](https://docs.nestjs.com/openapi/introduction)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
