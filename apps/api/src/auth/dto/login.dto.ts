import { createZodDto } from 'nestjs-zod'
import { loginRequestSchema } from '@repo/types'
import { ApiProperty } from '@nestjs/swagger'

export class LoginRequestDto extends createZodDto(loginRequestSchema) {
	@ApiProperty({ example: 'user@example.com', description: 'Email пользователя' })
	email: string

	@ApiProperty({ example: '123456', description: 'Пароль' })
	password: string
}
