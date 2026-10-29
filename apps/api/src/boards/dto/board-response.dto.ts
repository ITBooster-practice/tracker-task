import { ApiProperty } from '@nestjs/swagger'

export class BoardColumnResponseDto {
	@ApiProperty()
	id: string

	@ApiProperty()
	boardId: string

	@ApiProperty()
	projectId: string

	@ApiProperty({ example: 'TODO' })
	key: string

	@ApiProperty({ example: 'К выполнению' })
	title: string

	@ApiProperty({ example: 0 })
	position: number

	@ApiProperty()
	isSystem: boolean

	@ApiProperty({ type: String, format: 'date-time' })
	createdAt: Date

	@ApiProperty({ type: String, format: 'date-time' })
	updatedAt: Date
}

export class BoardResponseDto {
	@ApiProperty()
	id: string

	@ApiProperty()
	projectId: string

	@ApiProperty({ example: 'Разработка' })
	name: string

	@ApiProperty()
	isDefault: boolean

	@ApiProperty({ type: String, format: 'date-time' })
	createdAt: Date

	@ApiProperty({ type: String, format: 'date-time' })
	updatedAt: Date
}

export class BoardListItemResponseDto extends BoardResponseDto {
	@ApiProperty({ type: [BoardColumnResponseDto] })
	columns: BoardColumnResponseDto[]

	@ApiProperty({ example: 0, minimum: 0 })
	taskCount: number
}
