import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
	type Priority,
	type TaskStatus,
	type TaskType,
	TaskTypeSchema,
	createTaskSchema,
} from '@repo/types'
import { createZodDto } from 'nestjs-zod'

export class CreateTaskDto extends createZodDto(createTaskSchema) {
	@ApiPropertyOptional({
		type: [String],
		maxItems: 20,
		example: ['Backend', 'Срочно'],
		description: 'Метки проекта: до 20 имён длиной 1–40 символов',
	})
	labels?: string[]

	@ApiProperty({
		example: 'Fix login bug',
		description: 'Название задачи (1–255 символов)',
	})
	title: string

	@ApiPropertyOptional({
		example: 'The login form breaks on mobile Safari',
		description: 'Описание задачи (до 5000 символов)',
	})
	description?: string

	@ApiPropertyOptional({
		example: 'TASK',
		enum: TaskTypeSchema.options,
		default: 'TASK',
		description: 'Тип задачи; если не указан, используется TASK',
	})
	type?: TaskType

	@ApiPropertyOptional({
		example: 'TODO',
		enum: ['TODO', 'BACKLOG', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
		description: 'Статус задачи',
	})
	status?: TaskStatus

	@ApiPropertyOptional({
		example: 'MEDIUM',
		enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
		description: 'Приоритет задачи',
	})
	priority?: Priority

	@ApiPropertyOptional({
		example: 'user-uuid',
		description: 'ID исполнителя',
	})
	assigneeId?: string

	@ApiPropertyOptional({
		example: 'column-uuid',
		description:
			'Колонка проекта, в которой создаётся задача; без неё используется основная доска',
	})
	boardColumnId?: string

	@ApiPropertyOptional({
		example: '2025-12-31T23:59:59.000Z',
		description: 'Дедлайн задачи в формате ISO 8601',
	})
	dueDate?: string
}
