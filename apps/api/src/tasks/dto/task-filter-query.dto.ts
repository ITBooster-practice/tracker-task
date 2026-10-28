import { ApiPropertyOptional } from '@nestjs/swagger'
import {
	type Priority,
	type TaskStatus,
	type TaskType,
	type TaskSortBy,
	type TaskSortOrder,
	TaskTypeSchema,
	TaskSortBySchema,
	TaskSortOrderSchema,
	DEFAULT_TASK_SORT_BY,
	DEFAULT_TASK_SORT_ORDER,
	taskFilterQuerySchema,
} from '@repo/types'
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

	@ApiPropertyOptional({
		example: 'BUG',
		enum: TaskTypeSchema.options,
		description: 'Фильтр по типу задачи',
	})
	type?: TaskType

	@ApiPropertyOptional({
		example: 'login',
		maxLength: 255,
		description:
			'Поиск буквальной подстроки в title без учёта регистра. Пробелы по краям удаляются; пустое или пробельное значение не фильтрует список.',
	})
	search?: string

	@ApiPropertyOptional({
		enum: TaskSortBySchema.options,
		default: DEFAULT_TASK_SORT_BY,
		description:
			'Поле сортировки. Порядок по возрастанию: priority — LOW, MEDIUM, HIGH, CRITICAL; status — TODO, IN_PROGRESS, IN_REVIEW, DONE.',
	})
	sortBy: TaskSortBy

	@ApiPropertyOptional({
		enum: TaskSortOrderSchema.options,
		default: DEFAULT_TASK_SORT_ORDER,
		description:
			'Направление сортировки. При равных значениях выбранного поля задачи упорядочиваются по id в том же направлении.',
	})
	sortOrder: TaskSortOrder
}
