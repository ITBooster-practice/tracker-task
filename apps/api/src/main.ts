import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'

import cookieParser from 'cookie-parser'
import { setupSwagger } from './utils/swagger.util'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)
	app.enableCors()

	app.use(cookieParser())

	setupSwagger(app)

	await app.listen(4000)
}

void bootstrap()
