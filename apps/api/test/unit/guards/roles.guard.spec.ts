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

function createCtx(user: unknown = { id: USER_ID }, teamId: string | null = TEAM_ID) {
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

	it('пропускает запрос если @Roles не задан на обработчике', async () => {
		vi.mocked(reflector.getAllAndOverride).mockReturnValue(undefined)

		const result = await guard.canActivate(createCtx())

		expect(result).toBe(true)
		expect(prisma.teamMember.findUnique).not.toHaveBeenCalled()
	})

	it('пропускает если роль участника совпадает с требуемой', async () => {
		vi.mocked(reflector.getAllAndOverride).mockReturnValue(['OWNER'])
		prisma.teamMember.findUnique.mockResolvedValue(MEMBER_OWNER)

		const result = await guard.canActivate(createCtx({ id: USER_ID }))

		expect(result).toBe(true)
		expect(prisma.teamMember.findUnique).toHaveBeenCalledOnce()
		expect(prisma.teamMember.findUnique).toHaveBeenCalledWith({
			where: { teamId_userId: { teamId: TEAM_ID, userId: USER_ID } },
		})
	})

	it('выбрасывает 403 если роль участника не подходит', async () => {
		vi.mocked(reflector.getAllAndOverride).mockReturnValue(['OWNER'])
		prisma.teamMember.findUnique.mockResolvedValue(MEMBER_PLAIN)

		await expect(guard.canActivate(createCtx({ id: USER_ID }))).rejects.toThrow(
			ForbiddenException,
		)
	})

	it('выбрасывает 403 если user отсутствует в запросе', async () => {
		vi.mocked(reflector.getAllAndOverride).mockReturnValue(['OWNER'])

		await expect(guard.canActivate(createCtx(null, TEAM_ID))).rejects.toThrow(
			ForbiddenException,
		)
		expect(prisma.teamMember.findUnique).not.toHaveBeenCalled()
	})

	it('выбрасывает 403 если teamId отсутствует в запросе', async () => {
		vi.mocked(reflector.getAllAndOverride).mockReturnValue(['OWNER'])

		await expect(guard.canActivate(createCtx({ id: USER_ID }, null))).rejects.toThrow(
			ForbiddenException,
		)
		expect(prisma.teamMember.findUnique).not.toHaveBeenCalled()
	})

	it('выбрасывает 403 если member не найден в БД', async () => {
		vi.mocked(reflector.getAllAndOverride).mockReturnValue(['OWNER'])
		prisma.teamMember.findUnique.mockResolvedValue(null)

		await expect(guard.canActivate(createCtx({ id: USER_ID }))).rejects.toThrow(
			ForbiddenException,
		)
		expect(prisma.teamMember.findUnique).toHaveBeenCalledOnce()
	})
})
