import { createBoardSchema } from '@repo/types'
import { createZodDto } from 'nestjs-zod'

export class CreateBoardDto extends createZodDto(createBoardSchema) {}
