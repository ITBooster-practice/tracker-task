import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class ProjectResponseDto {
	@ApiProperty({ example: 'c1f2d3e4-5678-90ab-cdef-1234567890ab' })
	id: string

	@ApiProperty({ example: 'Backend Rewrite' })
	name: string

	@ApiPropertyOptional({ example: 'Полная переработка API на NestJS', nullable: true })
	description: string | null

	@ApiProperty({ example: 'a1b2c3d4-5678-90ab-cdef-1234567890ab' })
	teamId: string

	@ApiProperty({ example: 'f9e8d7c6-5432-10ab-cdef-0987654321ba' })
	createdById: string

	@ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
	createdAt: Date

	@ApiProperty({ example: '2024-03-20T14:45:00.000Z' })
	updatedAt: Date
}
