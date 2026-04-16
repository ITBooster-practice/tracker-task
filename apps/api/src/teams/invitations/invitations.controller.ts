import { Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import { Authorization } from '../../auth/decorators/authorization.decorator'
import { Authorized } from '../../auth/decorators/authorized.decorator'
import { TeamResponse } from '../dto/team-response.dto'
import {
	MyInvitationResponse,
	TeamInvitationResponse,
} from './dto/invitation-response.dto'
import { TeamInvitationsService } from './team-invitations.service'
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto'
import { ApiPaginatedOkResponse } from '../../utils/swagger.util'

@ApiTags('Invitations')
@ApiBearerAuth()
@Authorization()
@Controller('invitations')
export class InvitationsController {
	constructor(private readonly teamInvitationsService: TeamInvitationsService) {}

	@ApiOperation({ summary: 'Получить мои входящие приглашения' })
	@ApiPaginatedOkResponse(
		MyInvitationResponse,
		'Пагинированный список входящих приглашений',
	)
	@Get('me')
	getMyInvitations(
		@Authorized('id') userId: string,
		@Authorized('email') userEmail: string,
		@Query() pagination: PaginationQueryDto,
	) {
		return this.teamInvitationsService.getMyInvitations(userId, userEmail, pagination)
	}

	@ApiOperation({ summary: 'Принять приглашение по токену' })
	@ApiOkResponse({ type: TeamResponse })
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
