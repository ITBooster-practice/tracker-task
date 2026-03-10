import { createZodDto } from 'nestjs-zod'
import { createTeamSchema } from '@repo/types'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateTeamDto extends createZodDto(createTeamSchema) {
	@ApiProperty({ example: 'Dream Team', description: 'Название команды (2–50 символов)' })
	name: string

	@ApiPropertyOptional({
		example: 'Наша крутая команда',
		description: 'Описание команды (до 100 символов)',
	})
	description?: string

	@ApiPropertyOptional({
		example: 'https://example.com/avatar.png',
		description: 'URL аватара команды',
	})
	avatarUrl?: string
}
