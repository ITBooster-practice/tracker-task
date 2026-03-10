import { createZodDto } from 'nestjs-zod'
import { updateTeamSchema } from '@repo/types'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateTeamDto extends createZodDto(updateTeamSchema) {
	@ApiPropertyOptional({ example: 'New Name', description: 'Новое название команды' })
	name?: string

	@ApiPropertyOptional({
		example: 'Новое описание',
		description: 'Новое описание команды',
	})
	description?: string

	@ApiPropertyOptional({
		example: 'https://example.com/avatar.png',
		description: 'Новый URL аватара',
	})
	avatarUrl?: string
}
