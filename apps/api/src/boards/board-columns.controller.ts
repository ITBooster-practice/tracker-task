import {
	Body,
	Controller,
	Delete,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Post,
} from '@nestjs/common'
import {
	ApiBadRequestResponse,
	ApiBearerAuth,
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
import { BoardColumnsService } from './board-columns.service'
import { BoardColumnResponseDto } from './dto/board-response.dto'
import { CreateColumnDto } from './dto/create-column.dto'
import { DeleteColumnDto } from './dto/delete-column.dto'
import { ReorderColumnsDto } from './dto/reorder-columns.dto'
import { UpdateColumnDto } from './dto/update-column.dto'

@ApiTags('Board columns')
@ApiBearerAuth()
@Authorization()
@RequireFeatures(FEATURE_KEYS.BOARDS)
@ApiForbiddenResponse({ description: 'Операция доступна только OWNER и ADMIN команды' })
@ApiNotFoundResponse({ description: 'Доска или колонка не найдены' })
@ApiBadRequestResponse({ description: 'Некорректные параметры операции' })
@ApiConflictResponse({
	description: 'Дубликат, защищённая колонка или конфликт изменений',
})
@Controller('boards/:boardId/columns')
export class BoardColumnsController {
	constructor(private readonly columnsService: BoardColumnsService) {}

	@Post()
	@ApiOperation({ summary: 'Создать колонку (OWNER / ADMIN)' })
	@ApiCreatedResponse({ type: BoardColumnResponseDto })
	create(
		@Param('boardId') boardId: string,
		@Authorized('id') userId: string,
		@Body() dto: CreateColumnDto,
	) {
		return this.columnsService.create(boardId, userId, dto)
	}

	@Patch('reorder')
	@ApiOperation({ summary: 'Задать порядок всех колонок доски (OWNER / ADMIN)' })
	@ApiOkResponse({ type: BoardColumnResponseDto, isArray: true })
	reorder(
		@Param('boardId') boardId: string,
		@Authorized('id') userId: string,
		@Body() dto: ReorderColumnsDto,
	) {
		return this.columnsService.reorder(boardId, userId, dto)
	}

	@Patch(':columnId')
	@ApiOperation({ summary: 'Изменить ключ или название колонки (OWNER / ADMIN)' })
	@ApiOkResponse({ type: BoardColumnResponseDto })
	update(
		@Param('boardId') boardId: string,
		@Param('columnId') columnId: string,
		@Authorized('id') userId: string,
		@Body() dto: UpdateColumnDto,
	) {
		return this.columnsService.update(boardId, columnId, userId, dto)
	}

	@Delete(':columnId')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({
		summary: 'Перенести задачи в targetColumnId и удалить колонку (OWNER / ADMIN)',
	})
	@ApiNoContentResponse()
	remove(
		@Param('boardId') boardId: string,
		@Param('columnId') columnId: string,
		@Authorized('id') userId: string,
		@Body() dto: DeleteColumnDto,
	) {
		return this.columnsService.remove(boardId, columnId, userId, dto)
	}
}
