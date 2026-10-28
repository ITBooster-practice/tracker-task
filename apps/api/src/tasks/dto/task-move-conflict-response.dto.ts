import { ApiProperty } from '@nestjs/swagger'
import { TASK_MOVE_CONFLICT_REASONS, type TaskMoveConflictReason } from '@repo/types'

export class TaskMoveConflictResponseDto {
	@ApiProperty({ enum: [409] })
	statusCode: 409

	@ApiProperty({ enum: ['TASK_MOVE_CONFLICT'] })
	code: 'TASK_MOVE_CONFLICT'

	@ApiProperty()
	taskId: string

	@ApiProperty({ enum: TASK_MOVE_CONFLICT_REASONS })
	reason: TaskMoveConflictReason

	@ApiProperty()
	message: string
}
