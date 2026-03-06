import { DocumentBuilder } from '@nestjs/swagger'

export function getSwaggerConfig() {
	return new DocumentBuilder()
		.setTitle('Tracker Task API')
		.setDescription('API для управления проектами и задачами')
		.setVersion('1.0.0')
		.addBearerAuth()
		.build()
}
