import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { isTokenExpiredSoon } from '@/shared/lib/session'

function createToken(payload: { exp?: number }) {
	const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
	const body = btoa(JSON.stringify(payload))
	return `${header}.${body}.fake-signature`
}

const NOW_IN_SECONDS = 1000 // 1_000_000ms / 1000

describe('isTokenExpiredSoon', () => {
	beforeEach(() => {
		vi.spyOn(Date, 'now').mockReturnValue(1000000)
	})

	afterEach(() => vi.restoreAllMocks())

	it('токен истекает нескоро', () => {
		const token = createToken({ exp: 9999999999999 })

		const result = isTokenExpiredSoon(token)

		expect(result).toBe(false)
	})

	it('токен истекает менее чем через 30 секунд', () => {
		const token = createToken({ exp: NOW_IN_SECONDS + 20 })

		const result = isTokenExpiredSoon(token)

		expect(result).toBe(true)
	})

	it('токен истёк', () => {
		const token = createToken({ exp: NOW_IN_SECONDS - 100 })

		const result = isTokenExpiredSoon(token)

		expect(result).toBe(true)
	})

	it('кастомный leeway=30: токен не считается протухшим', () => {
		const token = createToken({ exp: NOW_IN_SECONDS + 50 })

		const leeway30 = isTokenExpiredSoon(token, 30)

		expect(leeway30).toBe(false)
	})

	it('кастомный leeway=60: токен считается протухшим', () => {
		const token = createToken({ exp: NOW_IN_SECONDS + 50 })

		const leeway60 = isTokenExpiredSoon(token, 60)

		expect(leeway60).toBe(true)
	})

	it('невалидный токен', () => {
		const result = isTokenExpiredSoon('')

		expect(result).toBe(false)
	})

	it('токен без exp', () => {
		const token = createToken({})

		const result = isTokenExpiredSoon(token)

		expect(result).toBe(false)
	})
})
