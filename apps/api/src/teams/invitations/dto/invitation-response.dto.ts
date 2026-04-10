import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { TeamRole } from '@repo/types'

export class InvitationInvitedByResponse {
	@ApiProperty({ example: 'uuid-user-1' })
	id: string

	@ApiProperty({ example: 'Иван Иванов', nullable: true })
	name: string | null

	@ApiProperty({ example: 'owner@example.com' })
	email: string
}

export class InvitationTeamSummaryResponse {
	@ApiProperty({ example: 'uuid-team-1' })
	id: string

	@ApiProperty({ example: 'Dream Team' })
	name: string

	@ApiPropertyOptional({ example: null, nullable: true })
	avatarUrl: string | null
}

export class TeamInvitationResponse {
	@ApiProperty({ example: 'uuid-invitation-1' })
	id: string

	@ApiProperty({ example: 'uuid-team-1' })
	teamId: string

	@ApiProperty({ example: 'uuid-user-1' })
	invitedById: string

	@ApiProperty({ example: 'user@example.com' })
	email: string

	@ApiProperty({ enum: ['OWNER', 'ADMIN', 'MEMBER'], example: 'MEMBER' })
	role: TeamRole

	@ApiProperty({
		enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED'],
		example: 'PENDING',
	})
	status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'

	@ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
	token: string

	@ApiProperty({ example: '2026-04-11T12:00:00.000Z' })
	expiresAt: Date

	@ApiProperty({ example: '2026-04-09T12:00:00.000Z' })
	createdAt: Date

	@ApiProperty({ example: '2026-04-09T12:00:00.000Z' })
	updatedAt: Date

	@ApiPropertyOptional({ type: InvitationInvitedByResponse })
	invitedBy?: InvitationInvitedByResponse

	@ApiPropertyOptional({ type: InvitationTeamSummaryResponse })
	team?: InvitationTeamSummaryResponse
}

export class MyInvitationResponse {
	@ApiProperty({ example: 'uuid-invitation-1' })
	id: string

	@ApiProperty({ example: 'user@example.com' })
	email: string

	@ApiProperty({ enum: ['OWNER', 'ADMIN', 'MEMBER'], example: 'MEMBER' })
	role: TeamRole

	@ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
	token: string

	@ApiProperty({ example: '2026-04-11T12:00:00.000Z' })
	expiresAt: Date

	@ApiProperty({ example: '2026-04-09T12:00:00.000Z' })
	createdAt: Date

	@ApiProperty({ type: InvitationTeamSummaryResponse })
	team: InvitationTeamSummaryResponse

	@ApiProperty({ type: InvitationInvitedByResponse })
	invitedBy: InvitationInvitedByResponse
}
