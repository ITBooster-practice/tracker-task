import { ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { ExecutionContext } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RolesGuard } from '../../../src/guards/roles.guard'
import {
	createPrismaMock,
	MEMBER_OWNER,
	MEMBER_PLAIN,
	TEAM_ID,
	USER_ID,
} from '../../helpers/teams.helpers'

// ── helpers ───────────────────────────────────────────────────────────────────

function createCtx(
	user: unknown = { id: USER_ID },
	teamId: string | undefined = TEAM_ID,
) {
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

// ── suite ─────────────────────────────────────────────────────────────────────
describe('RolesGuard', () => {
	let guard: RolesGuard
	let prisma: ReturnType<typeof createPrismaMock>
	let reflector: Reflector

	beforeEach(() => {
		vi.clearAllMocks()
		prisma = createPrismaMock()
		reflector = { getAllAndOverride: vi.fn() } as unknown as Reflector
		guard = new RolesGuard(reflector, prisma)
	})
})
