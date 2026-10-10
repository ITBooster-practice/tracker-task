import { afterEach, describe, expect, it, vi } from 'vitest'

import { subscribeToFeatureFlags } from '@/shared/lib/feature-flags/subscribe'

vi.mock('@/shared/lib/feature-flags/feature-flags-service', () => ({
	featureFlagsService: { eventsUrl: () => '/api/feature-flags/events' },
}))
class FakeEventSource extends EventTarget {
	static instances: FakeEventSource[] = []
	onopen: (() => void) | null = null
	onerror: (() => void) | null = null
	close = vi.fn()
	constructor(
		public url: string,
		public options: EventSourceInit,
	) {
		super()
		FakeEventSource.instances.push(this)
	}
}
describe('Feature flags event subscription', () => {
	afterEach(() => {
		vi.unstubAllGlobals()
		vi.useRealTimers()
		FakeEventSource.instances = []
	})
	it('uses cookies, reacts to server events and closes on unmount', async () => {
		vi.stubGlobal('EventSource', FakeEventSource)
		const refresh = vi.fn().mockResolvedValue(undefined),
			onChange = vi.fn(),
			onConnection = vi.fn()
		const stop = subscribeToFeatureFlags({ refresh, onChange, onConnection })
		await vi.waitFor(() => expect(FakeEventSource.instances).toHaveLength(1))
		const source = FakeEventSource.instances[0]!
		expect(source.options.withCredentials).toBe(true)
		source.onopen?.()
		source.dispatchEvent(
			new MessageEvent('feature-flags-changed', { data: '{"version":5}' }),
		)
		source.dispatchEvent(new MessageEvent('feature-flags-changed', { data: 'invalid' }))
		expect(onChange).toHaveBeenCalledExactlyOnceWith(5)
		expect(onConnection).toHaveBeenLastCalledWith('connected')
		stop()
		expect(source.close).toHaveBeenCalled()
	})
	it('refreshes the authenticated snapshot before reconnecting after expiry', async () => {
		vi.useFakeTimers()
		vi.stubGlobal('EventSource', FakeEventSource)
		const refresh = vi.fn().mockResolvedValue(undefined)
		const stop = subscribeToFeatureFlags({
			refresh,
			onChange: vi.fn(),
			onConnection: vi.fn(),
		})
		await vi.advanceTimersByTimeAsync(0)
		FakeEventSource.instances[0]!.dispatchEvent(new Event('session-expired'))
		await vi.advanceTimersByTimeAsync(1000)
		expect(refresh).toHaveBeenCalledTimes(2)
		expect(FakeEventSource.instances).toHaveLength(2)
		stop()
		await vi.advanceTimersByTimeAsync(30000)
		expect(FakeEventSource.instances).toHaveLength(2)
	})
})
