import { moveTaskToColumnSchema } from '@repo/types'
import { createZodDto } from 'nestjs-zod'

export class MoveTaskToColumnDto extends createZodDto(moveTaskToColumnSchema) {}
