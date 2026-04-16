import { ApiPropertyOptional } from '@nestjs/swagger'
import { createZodDto } from 'nestjs-zod'

import {
	DEFAULT_LIMIT,
	DEFAULT_PAGE,
	MAX_LIMIT,
	MIN_LIMIT,
	MIN_PAGE,
	paginationQuerySchema,
} from '@repo/types'

export class PaginationQueryDto extends createZodDto(paginationQuerySchema) {
	@ApiPropertyOptional({
		example: DEFAULT_PAGE,
		default: DEFAULT_PAGE,
		minimum: MIN_PAGE,
		description: 'Номер страницы, начиная с 1',
	})
	page: number

	@ApiPropertyOptional({
		example: DEFAULT_LIMIT,
		default: DEFAULT_LIMIT,
		minimum: MIN_LIMIT,
		maximum: MAX_LIMIT,
		description: 'Количество элементов на странице',
	})
	limit: number
}
