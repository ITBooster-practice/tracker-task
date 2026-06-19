import { z } from 'zod'

export const TaskStatusSchema = z.enum([
	'TODO',
	'BACKLOG',
	'IN_PROGRESS',
	'IN_REVIEW',
	'DONE',
])

export const PrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])

export const createTaskSchema = z.object({
	title: z
		.string({ message: 'Название должно быть строкой' })
		.min(1, { message: 'Название должно быть не менее 1 символа' })
		.max(255, { message: 'Название должно быть не длиннее 255 символов' }),
	description: z
		.string({ message: 'Описание должно быть строкой' })
		.max(5000, { message: 'Описание должно быть не длиннее 5000 символов' })
		.optional(),
	status: TaskStatusSchema.optional(),
	priority: PrioritySchema.optional(),
	assigneeId: z.string({ message: 'ID исполнителя должен быть строкой' }).optional(),
	dueDate: z
		.string({ message: 'Дата дедлайна должна быть строкой' })
		.datetime({ message: 'Дата дедлайна должна быть в формате ISO 8601' })
		.optional(),
})

export type CreateTask = z.infer<typeof createTaskSchema>
