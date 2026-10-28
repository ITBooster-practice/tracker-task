import { ApiProperty } from '@nestjs/swagger'
import {
	BoardColumnResponseDto,
	BoardResponseDto,
} from '../../boards/dto/board-response.dto'
import { TaskResponseDto } from './task-response.dto'

export class BoardTaskResponseDto extends TaskResponseDto {
	@ApiProperty()
	boardColumnId: string
}

export class BoardColumnWithTasksResponseDto extends BoardColumnResponseDto {
	@ApiProperty({ type: [BoardTaskResponseDto] })
	tasks: BoardTaskResponseDto[]
}

export class BoardViewResponseDto {
	@ApiProperty({ type: BoardResponseDto })
	board: BoardResponseDto

	@ApiProperty({ type: [BoardColumnWithTasksResponseDto] })
	columns: BoardColumnWithTasksResponseDto[]
}
