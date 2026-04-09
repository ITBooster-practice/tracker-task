import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiCreatedResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger'

import { Authorization } from '../../auth/decorators/authorization.decorator'
import { Authorized } from '../../auth/decorators/authorized.decorator'
import { TeamInvitationResponse } from './dto/invitation-response.dto'
import { SendInvitationDto } from './dto/send-invitation.dto'
import { TeamInvitationsService } from './team-invitations.service'

@ApiTags('Team Invitations')
@ApiBearerAuth()
@Authorization()
@Controller('teams/:id/invitations')
export class TeamInvitationsController {
	constructor(private readonly teamInvitationsService: TeamInvitationsService) {}

	@ApiOperation({ summary: 'Отправить приглашение в команду' })
	@ApiCreatedResponse({ type: TeamInvitationResponse })
	@Post()
	@HttpCode(HttpStatus.CREATED)
	sendInvitation(
		@Param('id') teamId: string,
		@Authorized('id') invitedById: string,
		@Body() dto: SendInvitationDto,
	) {
		return this.teamInvitationsService.sendInvitation(teamId, invitedById, dto)
	}

	@ApiOperation({ summary: 'Получить список приглашений команды' })
	@ApiOkResponse({ type: [TeamInvitationResponse] })
	@Get()
	getTeamInvitations(@Param('id') teamId: string, @Authorized('id') actorId: string) {
		return this.teamInvitationsService.getTeamInvitations(teamId, actorId)
	}

	@ApiOperation({ summary: 'Отозвать приглашение в команду' })
	@ApiOkResponse({ type: TeamInvitationResponse })
	@Delete(':invId')
	revokeInvitation(
		@Param('id') teamId: string,
		@Param('invId') invitationId: string,
		@Authorized('id') actorId: string,
	) {
		return this.teamInvitationsService.revokeInvitation(teamId, actorId, invitationId)
	}
}
