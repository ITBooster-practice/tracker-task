import { ApiPropertyOptional } from '@nestjs/swagger'
import { updateProjectSchema } from '@repo/types'
import { createZodDto } from 'nestjs-zod'

export class updateProjectDto extends createZodDto(updateProjectSchema) {
	@ApiPropertyOptional({
		example: 'Dream Project',
		description: 'Название проекта (1–50 символов)',
	})
	name?: string

	@ApiPropertyOptional({
		example: 'My cool project',
		description: 'Описание команды (до 500 символов)',
	})
	description?: string
}
