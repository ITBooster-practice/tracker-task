import {
	Body,
	Controller,
	Get,
	Header,
	Param,
	Patch,
	Req,
	Res,
	UseGuards,
} from '@nestjs/common'
import {
	ApiBody,
	ApiCookieAuth,
	ApiConflictResponse,
	ApiForbiddenResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
	ApiUnprocessableEntityResponse,
} from '@nestjs/swagger'
import type { UpdateFeatureFlag } from '@repo/types'
import type { Request, Response } from 'express'
import { Authorization } from '../auth/decorators/authorization.decorator'
import { Authorized } from '../auth/decorators/authorized.decorator'
import { SystemDeveloperGuard } from '../system-developer/system-developer.guard'
import { SystemDeveloperService } from '../system-developer/system-developer.service'
import {
	FeatureFlagMutationDto,
	FeatureFlagsAccessDto,
	FeatureFlagsListDto,
	FeatureFlagsSnapshotDto,
	UpdateFeatureFlagDto,
} from './dto/feature-flags.dto'
import { FeatureFlagValidationPipe } from './feature-flags-validation.pipe'
import { FeatureFlagsService } from './feature-flags.service'

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

	@Get('access')
	@ApiOperation({ summary: 'Право текущего пользователя управлять флагами' })
	@ApiOkResponse({ type: FeatureFlagsAccessDto })
	@Header('Cache-Control', 'private, no-store')
	access(@Authorized('id') userId: string) {
		return { canManage: this.developer.canManage(userId) }
	}

	@Get()
	@UseGuards(SystemDeveloperGuard)
	@ApiOperation({ summary: 'Список флагов и их подключения к приложению' })
	@ApiOkResponse({ type: FeatureFlagsListDto })
	@ApiForbiddenResponse({ description: 'Только разработчик системы' })
	@Header('Cache-Control', 'private, no-store')
	list() {
		return this.flags.list()
	}

	@Patch(':id')
	@ApiBody({ type: UpdateFeatureFlagDto })
	@UseGuards(SystemDeveloperGuard)
	@ApiOperation({ summary: 'Включить или выключить существующий флаг' })
	@ApiOkResponse({ type: FeatureFlagMutationDto })
	@ApiForbiddenResponse({ description: 'Только разработчик системы' })
	@ApiConflictResponse({ description: 'Устаревшая версия списка' })
	@ApiNotFoundResponse({ description: 'Флаг не найден' })
	@ApiUnprocessableEntityResponse({
		description: 'Некорректные поля или попытка включить неподключённый флаг',
	})
	update(
		@Param('id') id: string,
		@Body(new FeatureFlagValidationPipe(UpdateFeatureFlagDto)) dto: UpdateFeatureFlag,
	) {
		return this.flags.update(id, dto)
	}
}
