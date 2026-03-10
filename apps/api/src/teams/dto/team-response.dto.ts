import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { TeamRole } from '@repo/types'

export class TeamMemberResponse {
	@ApiProperty({ example: 'uuid-member-1' })
	id: string

	@ApiProperty({ example: 'uuid-user-1' })
	userId: string

	@ApiProperty({ example: 'Иван Иванов' })
	name: string | null

	@ApiProperty({ example: 'user@example.com' })
	email: string

	@ApiProperty({ enum: ['OWNER', 'ADMIN', 'MEMBER'], example: 'MEMBER' })
	role: TeamRole

	@ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
	joinedAt: Date
}

export class TeamResponse {
	@ApiProperty({ example: 'uuid-team-1' })
	id: string

	@ApiProperty({ example: 'Dream Team' })
	name: string

	@ApiPropertyOptional({ example: 'Наша крутая команда' })
	description: string | null

	@ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
	avatarUrl: string | null

	@ApiProperty({ type: [TeamMemberResponse] })
	members: TeamMemberResponse[]

	@ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
	createdAt: Date

	@ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
	updatedAt: Date
}

export class TeamListItemResponse {
	@ApiProperty({ example: 'uuid-team-1' })
	id: string

	@ApiProperty({ example: 'Dream Team' })
	name: string

	@ApiPropertyOptional({ example: 'Наша крутая команда' })
	description: string | null

	@ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
	avatarUrl: string | null

	@ApiProperty({ example: 3, description: 'Количество участников' })
	membersCount: number

	@ApiProperty({
		enum: ['OWNER', 'ADMIN', 'MEMBER'],
		example: 'OWNER',
		description: 'Роль текущего пользователя',
	})
	currentUserRole: TeamRole

	@ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
	createdAt: Date

	@ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
	updatedAt: Date
}
