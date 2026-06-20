import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class TaskResponseDto {
	@ApiProperty({ example: 'c1f2d3e4-5678-90ab-cdef-1234567890ab' })
	id: string

	@ApiProperty({ example: 'Fix login bug' })
	title: string

	@ApiPropertyOptional({
		example: 'The login form breaks on mobile Safari',
		nullable: true,
	})
	description: string | null

	@ApiProperty({
		example: 'TODO',
		enum: ['TODO', 'BACKLOG', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
	})
	status: string

	@ApiProperty({ example: 'MEDIUM', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
	priority: string

	@ApiProperty({ example: 1 })
	position: number

	@ApiPropertyOptional({ example: 'user-uuid', nullable: true })
	assigneeId: string | null

	@ApiProperty({ example: 'project-uuid' })
	projectId: string

	@ApiProperty({ example: 'user-uuid' })
	createdById: string

	@ApiPropertyOptional({ example: '2025-12-31T23:59:59.000Z', nullable: true })
	dueDate: Date | null

	@ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
	createdAt: Date

	@ApiProperty({ example: '2024-03-20T14:45:00.000Z' })
	updatedAt: Date
}
