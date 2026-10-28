import { updateBoardSchema } from '@repo/types'
import { createZodDto } from 'nestjs-zod'

export class UpdateBoardDto extends createZodDto(updateBoardSchema) {}
