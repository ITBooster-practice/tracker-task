import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { createProjectSchema } from '@repo/types'
import { createZodDto } from 'nestjs-zod'

export class createProjectDto extends createZodDto(createProjectSchema) {
	@ApiProperty({
		example: 'Dream Project',
		description: 'Название проекта (1–50 символов)',
	})
	name: string

	@ApiPropertyOptional({
		example: 'My cool project',
		description: 'Описание команды (до 500 символов)',
	})
	description: string
}
