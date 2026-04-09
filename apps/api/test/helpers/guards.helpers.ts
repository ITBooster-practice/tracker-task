import { vi } from 'vitest'
import type { ExecutionContext } from '@nestjs/common'

import { USER_ID, TEAM_ID } from './teams.helpers'

interface GuardRouteParams {
	teamId?: string | null
	id?: string | null
}

export function createCtx(
	user: unknown = { id: USER_ID },
	params: GuardRouteParams = { teamId: TEAM_ID },
): ExecutionContext {
	return {
		getHandler: vi.fn(),
		getClass: vi.fn(),
		switchToHttp: () => ({
			getRequest: () => ({
				user,
				params,
			}),
		}),
	} as unknown as ExecutionContext
}
