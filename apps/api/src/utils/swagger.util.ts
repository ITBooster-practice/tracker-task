import type { INestApplication } from '@nestjs/common'
import { applyDecorators, type Type } from '@nestjs/common'
import {
	ApiExtraModels,
	ApiOkResponse,
	ApiProperty,
	SwaggerModule,
	getSchemaPath,
} from '@nestjs/swagger'
import { cleanupOpenApiDoc } from 'nestjs-zod'
import { getSwaggerConfig } from 'src/auth/config/swagger.config'

class PaginationMetaDto {
	@ApiProperty({ example: 1, description: 'Текущая страница' })
	page: number

	@ApiProperty({ example: 10, description: 'Количество элементов на странице' })
	limit: number

	@ApiProperty({ example: 42, description: 'Общее количество элементов' })
	total: number

	@ApiProperty({ example: 5, description: 'Общее количество страниц' })
	totalPages: number
}

export function ApiPaginatedOkResponse<TModel extends Type<unknown>>(
	model: TModel,
	description: string,
) {
	return applyDecorators(
		ApiExtraModels(model, PaginationMetaDto),
		ApiOkResponse({
			description,
			schema: {
				type: 'object',
				properties: {
					data: {
						type: 'array',
						items: { $ref: getSchemaPath(model) },
					},
					meta: { $ref: getSchemaPath(PaginationMetaDto) },
				},
			},
		}),
	)
}

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
