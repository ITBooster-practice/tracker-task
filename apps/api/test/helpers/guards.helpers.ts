import { vi } from 'vitest'
import type { ExecutionContext } from '@nestjs/common'

import { USER_ID, TEAM_ID } from './teams.helpers'

export function createCtx(
	user: unknown = { id: USER_ID },
	teamId: string | null = TEAM_ID,
): ExecutionContext {
	return {
		getHandler: vi.fn(),
		getClass: vi.fn(),
		switchToHttp: () => ({
			getRequest: () => ({
				user,
				params: { teamId },
			}),
		}),
	} as unknown as ExecutionContext
}
