import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiForbiddenResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger'

import { TeamMembersService } from './team-members.service'
import { ChangeRoleDto } from './dto/change-role.dto'
import { MemberResponse } from './dto/member-response.dto'
import { Authorization } from '../../auth/decorators/authorization.decorator'
import { Authorized } from '../../auth/decorators/authorized.decorator'

@ApiTags('Team Members')
@ApiBearerAuth()
@Authorization()
@Controller('teams/:id/members')
export class TeamMembersController {
	constructor(private readonly teamMembersService: TeamMembersService) {}

	@ApiOperation({ summary: 'Список участников команды' })
	@ApiOkResponse({ type: [MemberResponse], description: 'Список участников' })
	@ApiForbiddenResponse({ description: 'Вы не являетесь участником этой команды' })
	@ApiNotFoundResponse({ description: 'Команда не найдена' })
	@Get()
	getMembers(@Param('id') teamId: string, @Authorized('id') userId: string) {
		return this.teamMembersService.getMembers(teamId, userId)
	}

	@ApiOperation({ summary: 'Изменить роль участника (OWNER / ADMIN)' })
	@ApiOkResponse({ type: MemberResponse, description: 'Роль изменена' })
	@ApiForbiddenResponse({
		description: 'Недостаточно прав или нельзя изменить роль OWNER',
	})
	@ApiNotFoundResponse({ description: 'Команда или участник не найден' })
	@Patch(':userId/role')
	@HttpCode(HttpStatus.OK)
	changeRole(
		@Param('id') teamId: string,
		@Param('userId') targetUserId: string,
		@Authorized('id') actorId: string,
		@Body() dto: ChangeRoleDto,
	) {
		return this.teamMembersService.changeRole(teamId, actorId, targetUserId, dto)
	}

	@ApiOperation({ summary: 'Исключить участника или покинуть команду' })
	@ApiOkResponse({
		description: 'Участник исключён / вы покинули команду',
		schema: { example: { message: 'Участник успешно исключён', success: true } },
	})
	@ApiForbiddenResponse({ description: 'Недостаточно прав или OWNER нельзя удалить' })
	@ApiNotFoundResponse({ description: 'Команда или участник не найден' })
	@Delete(':userId')
	removeMember(
		@Param('id') teamId: string,
		@Param('userId') targetUserId: string,
		@Authorized('id') actorId: string,
	) {
		return this.teamMembersService.removeMember(teamId, actorId, targetUserId)
	}
}
