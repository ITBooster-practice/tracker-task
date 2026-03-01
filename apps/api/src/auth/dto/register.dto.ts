import { createZodDto } from 'nestjs-zod'
import { registerRequestSchema } from '@repo/types'

// Создаём DTO класс для NestJS и Swagger из схемы
export class RegisterRequestDto extends createZodDto(registerRequestSchema) {}
