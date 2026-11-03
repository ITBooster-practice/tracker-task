import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useServerNow } from '@/shared/hooks/use-server-now'
import { syncServerClock } from '@/shared/lib/server-clock'

const serverTime = Date.parse('2026-11-02T12:00:00.000Z')

describe('useServerNow', () => {
	beforeEach(() => {
		vi.useFakeTimers({ toFake: ['Date', 'performance', 'setInterval', 'clearInterval'] })
		vi.setSystemTime(new Date('2099-01-01T00:00:00.000Z'))
		syncServerClock(new Date(serverTime).toUTCString())
	})
	afterEach(() => {
		cleanup()
		vi.useRealTimers()
	})

	it('uses server time and keeps advancing when the device clock changes', () => {
		const { result } = renderHook(() => useServerNow())
		expect(result.current).toBe(serverTime)
		vi.setSystemTime(new Date('2000-01-01T00:00:00.000Z'))
		act(() => vi.advanceTimersByTime(2000))
		expect(result.current).toBe(serverTime + 2000)
	})

	it('updates from new responses and ignores missing or invalid Date headers', () => {
		const { result } = renderHook(() => useServerNow())
		act(() => syncServerClock(new Date(serverTime + 10_000).toUTCString()))
		expect(result.current).toBe(serverTime + 10_000)
		act(() => {
			syncServerClock(undefined)
			syncServerClock('invalid')
		})
		expect(result.current).toBe(serverTime + 10_000)
	})

	it('shares one timer between consumers and clears it on unmount', () => {
		const { result, unmount } = renderHook(() => [useServerNow(), useServerNow()])
		expect(vi.getTimerCount()).toBe(1)
		act(() => vi.advanceTimersByTime(1000))
		expect(result.current).toEqual([serverTime + 1000, serverTime + 1000])
		unmount()
		expect(vi.getTimerCount()).toBe(0)
	})

	it('refreshes elapsed time as soon as the window regains focus', () => {
		const { result } = renderHook(() => useServerNow())
		act(() => {
			vi.advanceTimersByTime(500)
			window.dispatchEvent(new Event('focus'))
		})
		expect(result.current).toBe(serverTime + 500)
	})
})
