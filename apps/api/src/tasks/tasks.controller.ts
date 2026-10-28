import { RequireFeatures } from '../feature-flags/feature.guard'
import { FEATURE_KEYS } from '@repo/types'
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
	ApiBadRequestResponse,
	ApiBody,
	ApiConflictResponse,
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
import { BoardQueryDto } from './dto/board-query.dto'
import { BoardViewResponseDto, BoardTaskResponseDto } from './dto/board-view-response.dto'
import { MoveTaskToColumnDto } from './dto/move-task-to-column.dto'
import { BoardTasksService } from './board-tasks.service'
import { CreateTaskDto } from './dto/create-task.dto'
import { TaskResponseDto } from './dto/task-response.dto'
import { TaskMoveConflictResponseDto } from './dto/task-move-conflict-response.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import { TaskFilterQueryDto } from './dto/task-filter-query.dto'
import { TasksService } from './tasks.service'

@RequireFeatures(FEATURE_KEYS.PROJECTS, FEATURE_KEYS.TASKS)
@ApiTags('Tasks')
@ApiBearerAuth()
@Authorization()
@Controller('teams/:teamId/projects/:projectId/tasks')
export class TasksController {
	constructor(
		private readonly tasksService: TasksService,
		private readonly boardTasksService: BoardTasksService,
	) {}

	@ApiOperation({ summary: 'Создать задачу' })
	@ApiCreatedResponse({ type: TaskResponseDto, description: 'Задача успешно создана' })
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
	@ApiOkResponse({ type: [TaskResponseDto], description: 'Пагинированный список задач' })
	@ApiBadRequestResponse({
		description: 'Некорректные параметры фильтрации, поиска, сортировки или пагинации',
	})
	@ApiForbiddenResponse({ description: 'Вы не являетесь участником этой команды' })
	@Get()
	findAll(
		@Param('teamId') teamId: string,
		@Param('projectId') projectId: string,
		@Authorized('id') userId: string,
		@Query() query: TaskFilterQueryDto,
	) {
		const { page, limit, ...filters } = query
		return this.tasksService.findAll(teamId, projectId, userId, filters, { page, limit })
	}

	@ApiOperation({
		summary: 'Получить доску с колонками и задачами',
		description: 'boardId выбирает доску проекта.',
	})
	@ApiOkResponse({ type: BoardViewResponseDto })
	@ApiBadRequestResponse({ description: 'Некорректный boardId' })
	@ApiNotFoundResponse({ description: 'Проект или доска не найдены' })
	@ApiForbiddenResponse({ description: 'Вы не являетесь участником этой команды' })
	@RequireFeatures(FEATURE_KEYS.BOARDS)
	@Get('board')
	getBoard(
		@Param('teamId') teamId: string,
		@Param('projectId') projectId: string,
		@Authorized('id') userId: string,
		@Query() query: BoardQueryDto,
	) {
		return this.boardTasksService.getBoard(teamId, projectId, query.boardId, userId)
	}

	@ApiOperation({ summary: 'Получить задачу по ID' })
	@ApiOkResponse({ type: TaskResponseDto, description: 'Данные задачи' })
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
	@ApiOkResponse({ type: TaskResponseDto, description: 'Задача обновлена' })
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

	@ApiOperation({
		summary: 'Переместить задачу между колонками или внутри колонки',
		description:
			'fromColumnId, toColumnId и position задают колонку и индекс вставки с нуля; expectedVersion — значение version задачи из последнего ответа API. После успешного переноса или ответа 409 перечитайте затронутые доски, чтобы обновить порядок и версии задач, включая соседние.',
	})
	@ApiBody({ type: MoveTaskToColumnDto })
	@ApiOkResponse({ type: BoardTaskResponseDto })
	@ApiBadRequestResponse({ description: 'Некорректный формат перемещения или позиция' })
	@ApiConflictResponse({ type: TaskMoveConflictResponseDto })
	@ApiNotFoundResponse({ description: 'Задача не найдена' })
	@ApiForbiddenResponse({ description: 'Вы не являетесь участником этой команды' })
	@Patch(':taskId/move')
	moveTask(
		@Param('teamId') teamId: string,
		@Param('projectId') projectId: string,
		@Param('taskId') taskId: string,
		@Authorized('id') userId: string,
		@Body() dto: MoveTaskToColumnDto,
	) {
		return this.boardTasksService.moveTask(teamId, projectId, taskId, userId, dto)
	}

	@ApiOperation({ summary: 'Удалить задачу (OWNER / ADMIN)' })
	@ApiNoContentResponse({ description: 'Задача удалена' })
	@ApiNotFoundResponse({ description: 'Задача не найдена' })
	@ApiForbiddenResponse({ description: 'Недостаточно прав для удаления задачи' })
	@Delete(':taskId')
	@HttpCode(HttpStatus.NO_CONTENT)
	remove(
		@Param('teamId') teamId: string,
		@Param('projectId') projectId: string,
		@Param('taskId') taskId: string,
		@Authorized('id') userId: string,
	) {
		return this.tasksService.remove(teamId, projectId, taskId, userId)
	}
}
