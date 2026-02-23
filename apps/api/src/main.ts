import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)
	app.enableCors()

	const config = new DocumentBuilder()
		.setTitle('Tracker Task API')
		.setDescription('API для управления проектами и задачами')
		.setVersion('1.0.0')
		.addBearerAuth()
		.build()

	const document = SwaggerModule.createDocument(app, config)

	SwaggerModule.setup('api/docs', app, document)

	await app.listen(4000)
}

void bootstrap()
