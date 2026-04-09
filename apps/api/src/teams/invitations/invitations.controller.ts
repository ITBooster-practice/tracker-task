import { Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import { Authorization } from '../../auth/decorators/authorization.decorator'
import { Authorized } from '../../auth/decorators/authorized.decorator'
import {
	MyInvitationResponse,
	TeamInvitationResponse,
} from './dto/invitation-response.dto'
import { TeamInvitationsService } from './team-invitations.service'

@ApiTags('Invitations')
@ApiBearerAuth()
@Authorization()
@Controller('invitations')
export class InvitationsController {
	constructor(private readonly teamInvitationsService: TeamInvitationsService) {}

	@ApiOperation({ summary: 'Получить мои входящие приглашения' })
	@ApiOkResponse({ type: [MyInvitationResponse] })
	@Get('me')
	getMyInvitations(
		@Authorized('id') userId: string,
		@Authorized('email') userEmail: string,
	) {
		return this.teamInvitationsService.getMyInvitations(userId, userEmail)
	}

	@ApiOperation({ summary: 'Принять приглашение по токену' })
	@ApiOkResponse({ type: TeamInvitationResponse })
	@Post(':token/accept')
	@HttpCode(HttpStatus.OK)
	acceptInvitation(
		@Param('token') token: string,
		@Authorized('id') userId: string,
		@Authorized('email') userEmail: string,
	) {
		return this.teamInvitationsService.acceptInvitation(token, userId, userEmail)
	}

	@ApiOperation({ summary: 'Отклонить приглашение по токену' })
	@ApiOkResponse({ type: TeamInvitationResponse })
	@Post(':token/decline')
	@HttpCode(HttpStatus.OK)
	declineInvitation(
		@Param('token') token: string,
		@Authorized('id') userId: string,
		@Authorized('email') userEmail: string,
	) {
		return this.teamInvitationsService.declineInvitation(token, userId, userEmail)
	}
}
