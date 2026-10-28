import { deleteColumnSchema } from '@repo/types'
import { createZodDto } from 'nestjs-zod'

export class DeleteColumnDto extends createZodDto(deleteColumnSchema) {}
