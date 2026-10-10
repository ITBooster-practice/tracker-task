import {
	Body,
	Controller,
	Get,
	Header,
	Param,
	Patch,
	Post,
	Req,
	Res,
	UseGuards,
} from '@nestjs/common'
import {
	ApiCookieAuth,
	ApiConflictResponse,
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
	ApiUnprocessableEntityResponse,
} from '@nestjs/swagger'
import type {
	CreateFeatureFlag,
	UpdateFeatureFlag,
	ArchiveFeatureFlag,
} from '@repo/types'
import { FeatureFlagValidationPipe } from './feature-flags-validation.pipe'
import { ApiBody } from '@nestjs/swagger'
import type { Request, Response } from 'express'
import { Authorization } from '../auth/decorators/authorization.decorator'
import { Authorized } from '../auth/decorators/authorized.decorator'
import { SystemDeveloperGuard } from '../system-developer/system-developer.guard'
import { SystemDeveloperService } from '../system-developer/system-developer.service'
import { FeatureFlagsService } from './feature-flags.service'
import {
	ArchiveFeatureFlagDto,
	CreateFeatureFlagDto,
	FeatureFlagAuditDto,
	FeatureFlagMutationDto,
	FeatureFlagsAccessDto,
	FeatureFlagsListDto,
	FeatureFlagsSnapshotDto,
	FeatureFlagsServerTimeDto,
	UpdateFeatureFlagDto,
} from './dto/feature-flags.dto'

@ApiTags('Feature flags')
@ApiCookieAuth('accessToken')
@ApiUnauthorizedResponse({ description: 'Требуется авторизация' })
@Authorization()
@Controller('feature-flags')
export class FeatureFlagsController {
	constructor(
		private readonly flags: FeatureFlagsService,
		private readonly developer: SystemDeveloperService,
	) {}

	@Get('snapshot')
	@ApiOperation({ summary: 'Актуальный runtime-снимок флагов' })
	@ApiOkResponse({ type: FeatureFlagsSnapshotDto })
	@Header('Cache-Control', 'private, no-store')
	async snapshot(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
		const snapshot = await this.flags.snapshot()
		const etag = '"feature-flags-' + snapshot.version + '"'
		res.setHeader('ETag', etag)
		if (req.headers['if-none-match'] === etag) {
			res.status(304)
			return
		}
		return snapshot
	}
	@Get('server-time')
	@UseGuards(SystemDeveloperGuard)
	@ApiOperation({ summary: 'Время API для выбора плановой даты флага' })
	@ApiOkResponse({ type: FeatureFlagsServerTimeDto })
	@ApiForbiddenResponse({ description: 'Только разработчик системы' })
	@Header('Cache-Control', 'private, no-store')
	serverTime() {
		return { serverTime: new Date().toISOString() }
	}

	@Get('access')
	@ApiOperation({ summary: 'Право текущего пользователя управлять флагами' })
	@ApiOkResponse({ type: FeatureFlagsAccessDto })
	@Header('Cache-Control', 'private, no-store')
	access(@Authorized('id') userId: string) {
		return { canManage: this.developer.canManage(userId) }
	}

	@Get()
	@UseGuards(SystemDeveloperGuard)
	@ApiOperation({ summary: 'Список флагов, включая архив (разработчик системы)' })
	@ApiOkResponse({ type: FeatureFlagsListDto })
	@ApiForbiddenResponse({ description: 'Только разработчик системы' })
	@Header('Cache-Control', 'private, no-store')
	list() {
		return this.flags.list()
	}

	@Post()
	@ApiBody({ type: CreateFeatureFlagDto })
	@UseGuards(SystemDeveloperGuard)
	@ApiOperation({ summary: 'Создать выключенный флаг с новым техническим ключом' })
	@ApiCreatedResponse({ type: FeatureFlagMutationDto })
	@ApiForbiddenResponse({ description: 'Только разработчик системы' })
	@ApiConflictResponse({ description: 'Ключ существует или зарезервирован архивом' })
	@ApiUnprocessableEntityResponse({
		description: 'Некорректные поля или плановый срок раньше времени сервера',
	})
	create(
		@Authorized('id') userId: string,
		@Body(new FeatureFlagValidationPipe(CreateFeatureFlagDto)) dto: CreateFeatureFlag,
	) {
		return this.flags.create(userId, dto)
	}

	@Patch(':id')
	@ApiBody({ type: UpdateFeatureFlagDto })
	@UseGuards(SystemDeveloperGuard)
	@ApiOperation({ summary: 'Обновить флаг; технический ключ неизменяемый' })
	@ApiOkResponse({ type: FeatureFlagMutationDto })
	@ApiForbiddenResponse({ description: 'Только разработчик системы' })
	@ApiConflictResponse({ description: 'Устаревшая версия или флаг архивирован' })
	@ApiNotFoundResponse({ description: 'Флаг не найден' })
	@ApiUnprocessableEntityResponse({
		description:
			'Некорректные поля, попытка включить неподключённый флаг или плановый срок раньше времени сервера',
	})
	update(
		@Authorized('id') userId: string,
		@Param('id') id: string,
		@Body(new FeatureFlagValidationPipe(UpdateFeatureFlagDto)) dto: UpdateFeatureFlag,
	) {
		return this.flags.update(userId, id, dto)
	}

	@Post(':id/archive')
	@ApiBody({ type: ArchiveFeatureFlagDto })
	@UseGuards(SystemDeveloperGuard)
	@ApiOperation({ summary: 'Архивировать флаг после завершения поддержки его проверок' })
	@ApiCreatedResponse({ type: FeatureFlagMutationDto })
	@ApiForbiddenResponse({ description: 'Только разработчик системы' })
	@ApiConflictResponse({
		description: 'Ключ используется кодом, устаревшая версия или флаг архивирован',
	})
	@ApiNotFoundResponse({ description: 'Флаг не найден' })
	@ApiUnprocessableEntityResponse({ description: 'Некорректные поля' })
	archive(
		@Authorized('id') userId: string,
		@Param('id') id: string,
		@Body(new FeatureFlagValidationPipe(ArchiveFeatureFlagDto)) dto: ArchiveFeatureFlag,
	) {
		return this.flags.archive(userId, id, dto.expectedVersion)
	}

	@Get(':id/audit')
	@UseGuards(SystemDeveloperGuard)
	@ApiOperation({ summary: 'Последние 100 изменений флага' })
	@ApiOkResponse({ type: FeatureFlagAuditDto, isArray: true })
	@ApiForbiddenResponse({ description: 'Только разработчик системы' })
	@ApiNotFoundResponse({ description: 'Флаг не найден' })
	@Header('Cache-Control', 'private, no-store')
	audit(@Param('id') id: string) {
		return this.flags.audit(id)
	}
}
