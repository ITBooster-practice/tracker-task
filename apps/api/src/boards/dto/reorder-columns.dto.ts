import { reorderColumnsSchema } from '@repo/types'
import { createZodDto } from 'nestjs-zod'

export class ReorderColumnsDto extends createZodDto(reorderColumnsSchema) {}
