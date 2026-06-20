import { ApiProperty } from '@nestjs/swagger'
import { TaskResponseDto } from './task-response.dto'

export class BoardColumnDto {
	@ApiProperty({
		example: 'TODO',
		enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
	})
	status: string

	@ApiProperty({ type: [TaskResponseDto] })
	tasks: TaskResponseDto[]
}

export class BoardResponseDto {
	@ApiProperty({ type: [BoardColumnDto] })
	columns: BoardColumnDto[]
}
