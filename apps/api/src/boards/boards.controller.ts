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
} from '@nestjs/common'
import {
	ApiBadRequestResponse,
	ApiBearerAuth,
	ApiBody,
	ApiConflictResponse,
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiNoContentResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger'
import { FEATURE_KEYS } from '@repo/types'
import { Authorization } from '../auth/decorators/authorization.decorator'
import { Authorized } from '../auth/decorators/authorized.decorator'
import { RequireFeatures } from '../feature-flags/feature.guard'
import { BoardsService } from './boards.service'
import { BoardListItemResponseDto } from './dto/board-response.dto'
import { CreateBoardDto } from './dto/create-board.dto'
import { DeleteBoardDto } from './dto/delete-board.dto'
import { UpdateBoardDto } from './dto/update-board.dto'

@ApiTags('Boards')
@ApiBearerAuth()
@RequireFeatures(FEATURE_KEYS.BOARDS)
@Authorization()
@ApiForbiddenResponse({ description: 'Нет доступа к команде или операции' })
@ApiNotFoundResponse({ description: 'Проект или доска не найдены в указанной области' })
@Controller('teams/:teamId/projects/:projectId/boards')
export class BoardsController {
	constructor(private readonly boardsService: BoardsService) {}

	@Get()
	@ApiOperation({ summary: 'Список досок проекта с колонками' })
	@ApiOkResponse({ type: BoardListItemResponseDto, isArray: true })
	findAll(
		@Param('teamId') teamId: string,
		@Param('projectId') projectId: string,
		@Authorized('id') userId: string,
	) {
		return this.boardsService.findAll(teamId, projectId, userId)
	}

	@Post()
	@ApiOperation({ summary: 'Создать доску (OWNER / ADMIN)' })
	@ApiCreatedResponse({ type: BoardListItemResponseDto })
	@ApiBadRequestResponse({ description: 'Некорректное название доски' })
	@ApiConflictResponse({ description: 'Название уже занято в проекте' })
	create(
		@Param('teamId') teamId: string,
		@Param('projectId') projectId: string,
		@Authorized('id') userId: string,
		@Body() dto: CreateBoardDto,
	) {
		return this.boardsService.create(teamId, projectId, userId, dto)
	}

	@Patch(':boardId')
	@ApiOperation({ summary: 'Переименовать доску (OWNER / ADMIN)' })
	@ApiOkResponse({ type: BoardListItemResponseDto })
	@ApiBadRequestResponse({ description: 'Некорректное название доски' })
	@ApiConflictResponse({ description: 'Название уже занято в проекте' })
	update(
		@Param('teamId') teamId: string,
		@Param('projectId') projectId: string,
		@Param('boardId') boardId: string,
		@Authorized('id') userId: string,
		@Body() dto: UpdateBoardDto,
	) {
		return this.boardsService.update(teamId, projectId, boardId, userId, dto)
	}

	@Delete(':boardId')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Удалить пустую доску (OWNER / ADMIN)' })
	@ApiBody({ type: DeleteBoardDto, required: false })
	@ApiNoContentResponse()
	@ApiBadRequestResponse({ description: 'Тело запроса должно быть пустым' })
	@ApiConflictResponse({ description: 'Основная доска или доска с задачами' })
	remove(
		@Param('teamId') teamId: string,
		@Param('projectId') projectId: string,
		@Param('boardId') boardId: string,
		@Authorized('id') userId: string,
		@Body() dto: DeleteBoardDto,
	) {
		void dto // Validate the empty request body before deleting the resource.
		return this.boardsService.remove(teamId, projectId, boardId, userId)
	}
}
