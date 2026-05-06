import { ApiPropertyOptional } from '@nestjs/swagger'
import { updateProjectSchema } from '@repo/types'
import { createZodDto } from 'nestjs-zod'

export class UpdateProjectDto extends createZodDto(updateProjectSchema) {
	@ApiPropertyOptional({
		example: 'Dream Project',
		description: 'Название проекта (1–100 символов)',
	})
	name?: string

	@ApiPropertyOptional({
		example: 'My cool project',
		description: 'Описание проекта (до 500 символов)',
	})
	description?: string
}
