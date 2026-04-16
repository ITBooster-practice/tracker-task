import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger'

import { Authorization } from '../../auth/decorators/authorization.decorator'
import { Authorized } from '../../auth/decorators/authorized.decorator'
import { Roles } from '../../auth/decorators/roles.decorator'
import { RolesGuard } from '../../guards/roles.guard'
import { TeamInvitationResponse } from './dto/invitation-response.dto'
import { SendInvitationDto } from './dto/send-invitation.dto'
import { TeamInvitationsService } from './team-invitations.service'
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto'

@ApiTags('Team Invitations')
@ApiBearerAuth()
@Authorization()
@Controller('teams/:id/invitations')
export class TeamInvitationsController {
	constructor(private readonly teamInvitationsService: TeamInvitationsService) {}

	@ApiOperation({ summary: 'Отправить приглашение в команду' })
	@ApiCreatedResponse({ type: TeamInvitationResponse })
	@ApiForbiddenResponse({ description: 'Недостаточно прав для управления приглашениями' })
	@Post()
	@HttpCode(HttpStatus.CREATED)
	@UseGuards(RolesGuard)
	@Roles('OWNER', 'ADMIN')
	sendInvitation(
		@Param('id') teamId: string,
		@Authorized('id') invitedById: string,
		@Body() dto: SendInvitationDto,
	) {
		return this.teamInvitationsService.sendInvitation(teamId, invitedById, dto)
	}

	@ApiOperation({ summary: 'Получить список приглашений команды' })
	@ApiOkResponse({
		description: 'Пагинированный список приглашений команды',
		schema: {
			type: 'object',
			properties: {
				data: {
					type: 'array',
					items: { $ref: '#/components/schemas/TeamInvitationResponse' },
				},
				meta: {
					type: 'object',
					properties: {
						page: { type: 'number', example: 1 },
						limit: { type: 'number', example: 10 },
						total: { type: 'number', example: 1 },
						totalPages: { type: 'number', example: 1 },
					},
				},
			},
		},
	})
	@ApiForbiddenResponse({ description: 'Недостаточно прав для управления приглашениями' })
	@Get()
	@UseGuards(RolesGuard)
	@Roles('OWNER', 'ADMIN')
	getTeamInvitations(
		@Param('id') teamId: string,
		@Authorized('id') actorId: string,
		@Query() pagination: PaginationQueryDto,
	) {
		return this.teamInvitationsService.getTeamInvitations(teamId, actorId, pagination)
	}

	@ApiOperation({ summary: 'Отозвать приглашение в команду' })
	@ApiOkResponse({ type: TeamInvitationResponse })
	@ApiForbiddenResponse({ description: 'Недостаточно прав для управления приглашениями' })
	@Delete(':invId')
	@UseGuards(RolesGuard)
	@Roles('OWNER', 'ADMIN')
	revokeInvitation(
		@Param('id') teamId: string,
		@Param('invId') invitationId: string,
		@Authorized('id') actorId: string,
	) {
		return this.teamInvitationsService.revokeInvitation(teamId, actorId, invitationId)
	}
}
