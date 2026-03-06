import { createZodDto } from 'nestjs-zod'
import { registerRequestSchema } from '@repo/types'
import { ApiProperty } from '@nestjs/swagger'

// Создаём DTO класс для NestJS и Swagger из схемы
export class RegisterRequestDto extends createZodDto(registerRequestSchema) {
	@ApiProperty({ example: 'Иван Иванов', description: 'Имя пользователя' })
	name: string

	@ApiProperty({ example: 'user@example.com', description: 'Email пользователя' })
	email: string

	@ApiProperty({ example: '123456', description: 'Пароль' })
	password: string
}
