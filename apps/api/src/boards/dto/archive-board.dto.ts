import { archiveBoardSchema } from '@repo/types'
import { createZodDto } from 'nestjs-zod'

export class ArchiveBoardDto extends createZodDto(archiveBoardSchema) {}
