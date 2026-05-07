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
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger'

import { Authorization } from '../auth/decorators/authorization.decorator'
import { Authorized } from '../auth/decorators/authorized.decorator'
import { PaginationQueryDto } from '../common/dto/pagination-query.dto'
import { ApiPaginatedOkResponse } from '../utils/swagger.util'
import { CreateProjectDto } from './dto/create-project.dto'
import { ProjectResponseDto } from './dto/project-response.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
import { ProjectsService } from './projects.service'

@ApiTags('Projects')
@ApiBearerAuth()
@Authorization()
@Controller('teams/:teamId/projects')
export class ProjectsController {
	constructor(private readonly projectsService: ProjectsService) {}

	@ApiOperation({ summary: 'Создать проект' })
	@ApiCreatedResponse({ type: ProjectResponseDto, description: 'Проект успешно создан' })
	@ApiForbiddenResponse({ description: 'Вы не являетесь участником этой команды' })
	@Post()
	@HttpCode(HttpStatus.CREATED)
	create(
		@Param('teamId') teamId: string,
		@Authorized('id') userId: string,
		@Body() dto: CreateProjectDto,
	) {
		return this.projectsService.create(teamId, userId, dto)
	}

	@ApiOperation({ summary: 'Список проектов команды' })
	@ApiPaginatedOkResponse(ProjectResponseDto, 'Пагинированный список проектов')
	@ApiForbiddenResponse({ description: 'Вы не являетесь участником этой команды' })
	@Get()
	findAll(
		@Param('teamId') teamId: string,
		@Authorized('id') userId: string,
		@Query() pagination: PaginationQueryDto,
	) {
		return this.projectsService.findAllByTeam(teamId, userId, pagination)
	}

	@ApiOperation({ summary: 'Получить проект по ID' })
	@ApiOkResponse({ type: ProjectResponseDto, description: 'Данные проекта' })
	@ApiNotFoundResponse({ description: 'Проект не найден' })
	@ApiForbiddenResponse({ description: 'Вы не являетесь участником этой команды' })
	@Get(':projectId')
	findOne(
		@Param('teamId') teamId: string,
		@Param('projectId') projectId: string,
		@Authorized('id') userId: string,
	) {
		return this.projectsService.findOne(teamId, projectId, userId)
	}

	@ApiOperation({ summary: 'Обновить проект (OWNER / ADMIN / создатель)' })
	@ApiOkResponse({ type: ProjectResponseDto, description: 'Проект обновлён' })
	@ApiNotFoundResponse({ description: 'Проект не найден' })
	@ApiForbiddenResponse({ description: 'Недостаточно прав для обновления проекта' })
	@Patch(':projectId')
	update(
		@Param('teamId') teamId: string,
		@Param('projectId') projectId: string,
		@Authorized('id') userId: string,
		@Body() dto: UpdateProjectDto,
	) {
		return this.projectsService.update(teamId, projectId, userId, dto)
	}

	@ApiOperation({ summary: 'Удалить проект (OWNER / ADMIN)' })
	@ApiOkResponse({
		description: 'Проект удалён',
		schema: { example: { message: 'Проект успешно удалён', success: true } },
	})
	@ApiNotFoundResponse({ description: 'Проект не найден' })
	@ApiForbiddenResponse({ description: 'Недостаточно прав для удаления проекта' })
	@Delete(':projectId')
	remove(
		@Param('teamId') teamId: string,
		@Param('projectId') projectId: string,
		@Authorized('id') userId: string,
	) {
		return this.projectsService.remove(teamId, projectId, userId)
	}
}
