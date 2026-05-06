import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { createProjectSchema } from '@repo/types'
import { createZodDto } from 'nestjs-zod'

export class CreateProjectDto extends createZodDto(createProjectSchema) {
	@ApiProperty({
		example: 'Dream Project',
		description: 'Название проекта (1–100 символов)',
	})
	name: string

	@ApiPropertyOptional({
		example: 'My cool project',
		description: 'Описание проекта (до 500 символов)',
	})
	description?: string
}
