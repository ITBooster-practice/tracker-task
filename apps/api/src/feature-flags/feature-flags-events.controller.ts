import { Controller, Header, Req, Sse } from '@nestjs/common'
import {
	ApiCookieAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import type { Request } from 'express'
import { Authorization } from '../auth/decorators/authorization.decorator'
import { Authorized } from '../auth/decorators/authorized.decorator'
import { FeatureFlagsEventsService } from './feature-flags-events.service'

@ApiTags('Feature flags')
@ApiCookieAuth('accessToken')
@Authorization()
@Controller('feature-flags')
export class FeatureFlagsEventsController {
	constructor(private readonly events: FeatureFlagsEventsService) {}
	@Sse('events')
	@Header('Cache-Control', 'private, no-store')
	@Header('X-Accel-Buffering', 'no')
	@ApiOperation({ summary: 'SSE-уведомления об изменениях флагов (cookie-сессия)' })
	@ApiResponse({
		status: 200,
		description: 'text/event-stream: feature-flags-changed, heartbeat, session-expired',
		content: { 'text/event-stream': { schema: { type: 'string' } } },
	})
	@ApiUnauthorizedResponse({ description: 'Требуется авторизация' })
	eventsStream(@Req() req: Request, @Authorized('id') userId: string) {
		return this.events.stream(req.cookies.accessToken as string, userId)
	}
}
