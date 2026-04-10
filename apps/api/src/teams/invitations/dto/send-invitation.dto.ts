import { ApiProperty } from '@nestjs/swagger'
import { sendInvitationSchema, TeamRole } from '@repo/types'
import { createZodDto } from 'nestjs-zod'

export class SendInvitationDto extends createZodDto(sendInvitationSchema) {
	@ApiProperty({
		example: 'user@example.com',
		description: 'Email пользователя для приглашения',
	})
	email: string

	@ApiProperty({
		enum: ['ADMIN', 'MEMBER'],
		example: 'MEMBER',
		description: 'Роль в команде после принятия приглашения',
	})
	role: Extract<TeamRole, 'ADMIN' | 'MEMBER'>
}
