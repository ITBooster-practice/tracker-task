import { ApiProperty } from '@nestjs/swagger'
import { type TaskStatus, moveTaskSchema } from '@repo/types'
import { createZodDto } from 'nestjs-zod'

export class MoveTaskDto extends createZodDto(moveTaskSchema) {
	@ApiProperty({
		example: 'IN_PROGRESS',
		enum: ['TODO', 'BACKLOG', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
		description: 'Новый статус задачи',
	})
	status: TaskStatus

	@ApiProperty({
		example: 2,
		description: 'Новая позиция задачи внутри колонки (начиная с 0)',
	})
	position: number
}
