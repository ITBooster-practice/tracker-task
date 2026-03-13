import { createZodDto } from 'nestjs-zod'
import { changeRoleSchema } from '@repo/types'
import { ApiProperty } from '@nestjs/swagger'

export class ChangeRoleDto extends createZodDto(changeRoleSchema) {
	@ApiProperty({
		enum: ['ADMIN', 'MEMBER'],
		example: 'ADMIN',
		description: 'Новая роль участника. OWNER назначить нельзя',
	})
	role: 'ADMIN' | 'MEMBER'
}
