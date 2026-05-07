import { Body, Controller, Param, Post, HttpCode, HttpStatus } from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiTags,
	ApiCreatedResponse,
	ApiBadRequestResponse,
} from '@nestjs/swagger'
import { Authorization } from 'src/auth/decorators/authorization.decorator'
import { ProjectsService } from './projects.service'
import { Authorized } from 'src/auth/decorators/authorized.decorator'
import { CreateProjectDto } from './dto/create-project.dto'
import { ProjectResponseDto } from './dto/project-response.dto'

@ApiTags('Projects')
@ApiBearerAuth()
@Authorization()
@Controller('teams/:teamId/projects')
export class ProjectsController {
	constructor(private readonly projectsService: ProjectsService) {}

	@ApiOperation({ summary: 'Создать проект' })
	@ApiCreatedResponse({ type: ProjectResponseDto, description: 'Проект успешно создан' })
	@ApiBadRequestResponse({ description: 'Некорректные данные' })
	@Post()
	@HttpCode(HttpStatus.CREATED)
	async create(
		@Param('teamId') teamId: string,
		@Authorized('id') userId: string,
		@Body() dto: CreateProjectDto,
	) {
		return this.projectsService.create(teamId, userId, dto)
	}
}
