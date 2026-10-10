import { ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { describe, expect, it, vi } from 'vitest'
import { FeatureGuard } from '../../../src/feature-flags/feature.guard'
import { FeatureFlagsService } from '../../../src/feature-flags/feature-flags.service'
import { createCtx } from '../../helpers/guards.helpers'

describe('FeatureGuard', () => {
	const setup = (keys?: string[]) => {
		const flags = { requireEnabled: vi.fn().mockResolvedValue(undefined) }
		const reflector = { getAllAndMerge: vi.fn().mockReturnValue(keys) }
		const guard = new FeatureGuard(
			reflector as unknown as Reflector,
			flags as unknown as FeatureFlagsService,
		)
		return { flags, guard }
	}
	it('does not query flags for unflagged routes', async () => {
		const { flags, guard } = setup()
		expect(await guard.canActivate(createCtx())).toBe(true)
		expect(flags.requireEnabled).not.toHaveBeenCalled()
	})
	it('checks all inherited requirements, without duplicates', async () => {
		const { flags, guard } = setup(['projects', 'tasks', 'boards', 'tasks'])
		expect(await guard.canActivate(createCtx())).toBe(true)
		expect(flags.requireEnabled.mock.calls.map((args) => args[0])).toEqual([
			'projects',
			'tasks',
			'boards',
		])
	})
	it('does not let disabled endpoints reach their handler', async () => {
		const { flags, guard } = setup(['boards'])
		flags.requireEnabled.mockRejectedValue(new ForbiddenException())
		await expect(guard.canActivate(createCtx())).rejects.toThrow(ForbiddenException)
	})
})
