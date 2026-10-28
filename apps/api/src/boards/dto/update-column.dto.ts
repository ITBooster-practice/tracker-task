import { updateColumnSchema } from '@repo/types'
import { createZodDto } from 'nestjs-zod'

export class UpdateColumnDto extends createZodDto(updateColumnSchema) {}
