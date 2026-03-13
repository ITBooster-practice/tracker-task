import { ApiProperty } from '@nestjs/swagger'
import { TeamRole } from '@repo/types'

export class MemberUserDto {
	@ApiProperty({ example: 'uuid-user-1' })
	id: string

	@ApiProperty({ example: 'Иван Иванов', nullable: true })
	name: string | null

	@ApiProperty({ example: 'user@example.com' })
	email: string
}

export class MemberResponse {
	@ApiProperty({ example: 'uuid-member-1' })
	id: string

	@ApiProperty({ example: 'uuid-team-1' })
	teamId: string

	@ApiProperty({ example: 'uuid-user-1' })
	userId: string

	@ApiProperty({ type: MemberUserDto })
	user: MemberUserDto

	@ApiProperty({ enum: ['OWNER', 'ADMIN', 'MEMBER'], example: 'MEMBER' })
	role: TeamRole

	@ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
	joinedAt: Date
}
