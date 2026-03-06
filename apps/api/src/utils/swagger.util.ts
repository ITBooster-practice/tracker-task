import type { INestApplication } from '@nestjs/common'
import { SwaggerModule } from '@nestjs/swagger'
import { cleanupOpenApiDoc } from 'nestjs-zod'
import { getSwaggerConfig } from 'src/auth/config/swagger.config'

export function setupSwagger(app: INestApplication) {
	const config = getSwaggerConfig()

	const document = SwaggerModule.createDocument(app, config)

	SwaggerModule.setup('api/docs', app, cleanupOpenApiDoc(document), {
		jsonDocumentUrl: '/swagger.json',
		yamlDocumentUrl: '/swagger.yaml',
		swaggerOptions: {
			withCredentials: true,
		},
	})
}
