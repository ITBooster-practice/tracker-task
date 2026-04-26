import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiCreatedResponse,
	ApiNotFoundResponse,
	ApiForbiddenResponse,
	ApiBadRequestResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger'

import { TeamsService } from './teams.service'
import { CreateTeamDto } from './dto/create-team.dto'
import { UpdateTeamDto } from './dto/update-team.dto'
import { TeamResponse, TeamListItemResponse } from './dto/team-response.dto'
import { Authorization } from '../auth/decorators/authorization.decorator'
import { Authorized } from '../auth/decorators/authorized.decorator'
import { Roles } from '../auth/decorators/roles.decorator'
import { PaginationQueryDto } from '../common/dto/pagination-query.dto'
import { RolesGuard } from '../guards/roles.guard'
import { ApiPaginatedOkResponse } from '../utils/swagger.util'

@ApiTags('Teams')
@ApiBearerAuth()
@Authorization()
@Controller('teams')
export class TeamsController {
	constructor(private readonly teamsService: TeamsService) {}

	@ApiOperation({ summary: 'Создать команду' })
	@ApiCreatedResponse({ type: TeamResponse, description: 'Команда успешно создана' })
	@ApiBadRequestResponse({ description: 'Некорректные данные' })
	@Post('new')
	@HttpCode(HttpStatus.CREATED)
	createTeam(@Authorized('id') userId: string, @Body() dto: CreateTeamDto) {
		return this.teamsService.createTeam(userId, dto)
	}

	@ApiOperation({ summary: 'Список команд текущего пользователя' })
	@ApiPaginatedOkResponse(TeamListItemResponse, 'Пагинированный список команд')
	@Get()
	getUserTeams(
		@Authorized('id') userId: string,
		@Query() pagination: PaginationQueryDto,
	) {
		return this.teamsService.getUserTeams(userId, pagination)
	}

	@ApiOperation({ summary: 'Получить команду по ID' })
	@ApiOkResponse({ type: TeamResponse, description: 'Данные команды' })
	@ApiNotFoundResponse({ description: 'Команда не найдена' })
	@ApiForbiddenResponse({ description: 'Вы не являетесь участником этой команды' })
	@Get(':id')
	getTeamById(@Param('id') teamId: string, @Authorized('id') userId: string) {
		return this.teamsService.getTeamById(teamId, userId)
	}

	@ApiOperation({ summary: 'Обновить команду (OWNER / ADMIN)' })
	@ApiOkResponse({ type: TeamResponse, description: 'Команда обновлена' })
	@ApiBadRequestResponse({ description: 'Некорректные данные' })
	@ApiForbiddenResponse({ description: 'Недостаточно прав для обновления команды' })
	@ApiNotFoundResponse({ description: 'Команда не найдена' })
	@Patch(':id')
	@UseGuards(RolesGuard)
	@Roles('OWNER', 'ADMIN')
	updateTeam(
		@Param('id') teamId: string,
		@Authorized('id') userId: string,
		@Body() dto: UpdateTeamDto,
	) {
		return this.teamsService.updateTeam(teamId, userId, dto)
	}

	@ApiOperation({ summary: 'Удалить команду (только OWNER)' })
	@ApiOkResponse({
		description: 'Команда удалена',
		schema: { example: { message: 'Команда успешно удалена', success: true } },
	})
	@ApiForbiddenResponse({ description: 'Только владелец может удалить команду' })
	@ApiNotFoundResponse({ description: 'Команда не найдена' })
	@Delete(':id')
	@UseGuards(RolesGuard)
	@Roles('OWNER')
	deleteTeam(@Param('id') teamId: string, @Authorized('id') userId: string) {
		return this.teamsService.deleteTeam(teamId, userId)
	}
}
