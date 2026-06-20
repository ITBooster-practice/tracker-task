import { ApiPropertyOptional } from '@nestjs/swagger'
import { type Priority, type TaskStatus, taskFilterQuerySchema } from '@repo/types'
import { createZodDto } from 'nestjs-zod'

export class TaskFilterQueryDto extends createZodDto(taskFilterQuerySchema) {
	@ApiPropertyOptional({
		example: 1,
		description: 'Номер страницы',
	})
	page: number

	@ApiPropertyOptional({
		example: 10,
		description: 'Количество элементов на странице',
	})
	limit: number

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
