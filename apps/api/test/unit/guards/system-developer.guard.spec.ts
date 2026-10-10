import { ForbiddenException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { describe, expect, it } from 'vitest'
import { SystemDeveloperGuard } from '../../../src/system-developer/system-developer.guard'
import { SystemDeveloperService } from '../../../src/system-developer/system-developer.service'
import { createCtx } from '../../helpers/guards.helpers'

const developerId = 'dc6b1437-1168-497e-a1a9-5e4326c1d406'
const makeGuard = (id?: string) =>
	new SystemDeveloperGuard(
		new SystemDeveloperService(new ConfigService({ SYSTEM_DEVELOPER_USER_ID: id })),
	)

describe('SYSTEM_DEVELOPER', () => {
	it('allows only the configured authenticated account', () => {
		expect(makeGuard(developerId).canActivate(createCtx({ id: developerId }))).toBe(true)
	})
	it.each(['ADMIN', 'OWNER', 'MEMBER', 'SYSTEM_DEVELOPER'])(
		'does not trust a supplied %s role',
		(role) => {
			expect(() =>
				makeGuard(developerId).canActivate(createCtx({ id: 'another-user', role })),
			).toThrow(ForbiddenException)
		},
	)
	it.each([undefined, '', '   '])(
		'denies everyone when the setting is empty: %s',
		(id) => {
			expect(() => makeGuard(id).canActivate(createCtx({ id: developerId }))).toThrow(
				ForbiddenException,
			)
		},
	)
	it('denies unauthenticated requests', () => {
		expect(() => makeGuard(developerId).canActivate(createCtx(null))).toThrow(
			ForbiddenException,
		)
	})
})
