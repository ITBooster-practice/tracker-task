import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { featureFlagsService } from '@/shared/lib/feature-flags/feature-flags-service'
import { useServerClock } from '@/shared/lib/feature-flags/use-server-clock'

vi.mock('@/shared/lib/feature-flags/feature-flags-service', () => ({
	featureFlagsService: { serverTime: vi.fn() },
}))
afterEach(() => {
	cleanup()
	vi.restoreAllMocks()
	vi.useRealTimers()
})
function mount() {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false, gcTime: 0 } },
	})
	return renderHook(useServerClock, {
		wrapper: ({ children }: PropsWithChildren) => (
			<QueryClientProvider client={client}>{children}</QueryClientProvider>
		),
	})
}
describe('Server clock', () => {
	it('advances monotonically and ignores changes to the computer clock', async () => {
		const serverTime = '2026-10-10T12:34:30.000Z'
		let elapsed = 100
		vi.spyOn(performance, 'now').mockImplementation(() => elapsed)
		vi.spyOn(Date, 'now').mockReturnValue(new Date('2040-01-01').getTime())
		vi.mocked(featureFlagsService.serverTime).mockResolvedValue({ serverTime })
		const { result } = mount()
		await waitFor(() => expect(result.current.now?.toISOString()).toBe(serverTime))
		vi.mocked(Date.now).mockReturnValue(new Date('1990-01-01').getTime())
		elapsed += 2_000
		await waitFor(
			() =>
				expect(result.current.now?.getTime()).toBe(
					new Date(serverTime).getTime() + 2_000,
				),
			{ timeout: 2000 },
		)
	})
	it('refreshes from the API every minute and clears intervals on unmount', async () => {
		vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
		vi.mocked(featureFlagsService.serverTime).mockClear()
		vi.mocked(featureFlagsService.serverTime).mockResolvedValue({
			serverTime: '2026-10-10T12:34:30.000Z',
		})
		const { result, unmount } = mount()
		await act(async () => {
			await vi.advanceTimersByTimeAsync(1)
		})
		await waitFor(() => expect(result.current.now).not.toBeNull())
		expect(featureFlagsService.serverTime).toHaveBeenCalledOnce()
		await act(async () => {
			await vi.advanceTimersByTimeAsync(60_000)
		})
		await waitFor(() => expect(featureFlagsService.serverTime).toHaveBeenCalledTimes(2))
		unmount()
		expect(vi.getTimerCount()).toBe(0)
	})
	it('disables the clock after a failed refresh and supports retry', async () => {
		vi.mocked(featureFlagsService.serverTime).mockRejectedValue(new Error('offline'))
		const { result } = mount()
		await waitFor(() => expect(result.current.isError).toBe(true))
		expect(result.current.now).toBeNull()
		vi.mocked(featureFlagsService.serverTime).mockResolvedValue({
			serverTime: '2026-10-10T12:34:30.000Z',
		})
		await act(async () => {
			await result.current.retry()
		})
		await waitFor(() => expect(result.current.now).not.toBeNull())
		vi.mocked(featureFlagsService.serverTime).mockRejectedValue(new Error('offline'))
		await act(async () => {
			await result.current.retry()
		})
		await waitFor(() => expect(result.current.now).toBeNull())
	})
})
