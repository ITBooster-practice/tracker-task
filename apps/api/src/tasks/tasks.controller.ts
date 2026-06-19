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
	ApiNoContentResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger'

import { Authorization } from '../auth/decorators/authorization.decorator'
import { Authorized } from '../auth/decorators/authorized.decorator'
import { CreateTaskDto } from './dto/create-task.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import { TaskFilterQueryDto } from './dto/task-filter-query.dto'
import { TasksService } from './tasks.service'

@ApiTags('Tasks')
@ApiBearerAuth()
@Authorization()
@Controller('teams/:teamId/projects/:projectId/tasks')
export class TasksController {
	constructor(private readonly tasksService: TasksService) {}

	@ApiOperation({ summary: 'Создать задачу' })
	@ApiCreatedResponse({ description: 'Задача успешно создана' })
	@ApiForbiddenResponse({ description: 'Вы не являетесь участником этой команды' })
	@Post()
	@HttpCode(HttpStatus.CREATED)
	create(
		@Param('teamId') teamId: string,
		@Param('projectId') projectId: string,
		@Authorized('id') userId: string,
		@Body() dto: CreateTaskDto,
	) {
		return this.tasksService.create(teamId, projectId, userId, dto)
	}

	@ApiOperation({ summary: 'Список задач проекта' })
	@ApiOkResponse({ description: 'Пагинированный список задач' })
	@ApiForbiddenResponse({ description: 'Вы не являетесь участником этой команды' })
	@Get()
	findAll(
		@Param('teamId') teamId: string,
		@Param('projectId') projectId: string,
		@Authorized('id') userId: string,
		@Query() query: TaskFilterQueryDto,
	) {
		const { page, limit, status, priority, assigneeId } = query
		return this.tasksService.findAll(
			teamId,
			projectId,
			userId,
			{ status, priority, assigneeId },
			{ page, limit },
		)
	}

	@ApiOperation({ summary: 'Получить задачу по ID' })
	@ApiOkResponse({ description: 'Данные задачи' })
	@ApiNotFoundResponse({ description: 'Задача не найдена' })
	@ApiForbiddenResponse({ description: 'Вы не являетесь участником этой команды' })
	@Get(':taskId')
	findOne(
		@Param('teamId') teamId: string,
		@Param('projectId') projectId: string,
		@Param('taskId') taskId: string,
		@Authorized('id') userId: string,
	) {
		return this.tasksService.findOne(teamId, projectId, taskId, userId)
	}

	@ApiOperation({ summary: 'Обновить задачу (OWNER / ADMIN / создатель)' })
	@ApiOkResponse({ description: 'Задача обновлена' })
	@ApiNotFoundResponse({ description: 'Задача не найдена' })
	@ApiForbiddenResponse({ description: 'Недостаточно прав для обновления задачи' })
	@Patch(':taskId')
	update(
		@Param('teamId') teamId: string,
		@Param('projectId') projectId: string,
		@Param('taskId') taskId: string,
		@Authorized('id') userId: string,
		@Body() dto: UpdateTaskDto,
	) {
		return this.tasksService.update(teamId, projectId, taskId, userId, dto)
	}

	@ApiOperation({ summary: 'Удалить задачу (OWNER / ADMIN)' })
	@ApiNoContentResponse({ description: 'Задача удалена' })
	@ApiNotFoundResponse({ description: 'Задача не найдена' })
	@ApiForbiddenResponse({ description: 'Недостаточно прав для удаления задачи' })
	@Delete(':taskId')
	@HttpCode(HttpStatus.OK)
	remove(
		@Param('teamId') teamId: string,
		@Param('projectId') projectId: string,
		@Param('taskId') taskId: string,
		@Authorized('id') userId: string,
	) {
		return this.tasksService.remove(teamId, projectId, taskId, userId)
	}
}
