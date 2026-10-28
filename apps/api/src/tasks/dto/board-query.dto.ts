import { boardQuerySchema } from '@repo/types'
import { createZodDto } from 'nestjs-zod'

export class BoardQueryDto extends createZodDto(boardQuerySchema) {}
