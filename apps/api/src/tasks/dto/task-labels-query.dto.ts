import { ApiPropertyOptional } from '@nestjs/swagger'
import { taskLabelsQuerySchema } from '@repo/types'
import { createZodDto } from 'nestjs-zod'

export class TaskLabelsQueryDto extends createZodDto(taskLabelsQuerySchema) {
	@ApiPropertyOptional({
		example: 'backend',
		maxLength: 100,
		description: 'Буквальная подстрока в имени метки без учёта регистра',
	})
	search?: string
}
