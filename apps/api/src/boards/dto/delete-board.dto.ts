import { deleteBoardSchema } from '@repo/types'
import { createZodDto } from 'nestjs-zod'

export class DeleteBoardDto extends createZodDto(deleteBoardSchema) {}
