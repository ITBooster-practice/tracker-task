import { ApiPropertyOptional } from '@nestjs/swagger'
import { type Priority, type TaskStatus } from '@repo/types'
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto'

export class TaskFilterQueryDto extends PaginationQueryDto {
	@ApiPropertyOptional({
		example: 'TODO',
		enum: ['TODO', 'BACKLOG', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
		description: 'Фильтр по статусу задачи',
	})
	status?: TaskStatus

	@ApiPropertyOptional({
		example: 'HIGH',
		enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
		description: 'Фильтр по приоритету задачи',
	})
	priority?: Priority

	@ApiPropertyOptional({
		example: 'user-uuid',
		description: 'Фильтр по ID исполнителя',
	})
	assigneeId?: string
}
