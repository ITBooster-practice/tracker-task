import { createColumnSchema } from '@repo/types'
import { createZodDto } from 'nestjs-zod'

export class CreateColumnDto extends createZodDto(createColumnSchema) {}
