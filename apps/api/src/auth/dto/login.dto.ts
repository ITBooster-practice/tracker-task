import { createZodDto } from 'nestjs-zod'
import { loginRequestSchema } from '@repo/types'

export class LoginRequestDto extends createZodDto(loginRequestSchema) {}
