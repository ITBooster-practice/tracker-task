import { createZodDto } from 'nestjs-zod'
import { updateTeamSchema } from '@repo/types'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateTeamDto extends createZodDto(updateTeamSchema) {
	@ApiPropertyOptional({ example: 'New Name', description: 'Новое название команды' })
	name?: string

	@ApiPropertyOptional({
		example: 'Новое описание',
		description: 'Новое описание команды (до 100 символов)',
	})
	description?: string

	@ApiPropertyOptional({
		example: null,
		nullable: true,
		description:
			'Новый URL аватара. Если не указан — на клиенте используются инициалы названия',
	})
	avatarUrl?: string
}
