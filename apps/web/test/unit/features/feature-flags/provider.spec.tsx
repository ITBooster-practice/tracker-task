import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FEATURE_KEYS, type FeatureFlagsSnapshot } from '@repo/types'

import { FeatureFlagsProvider, FeatureGate } from '@/features/feature-flags'
import { featureFlagsService } from '@/shared/lib/feature-flags/feature-flags-service'

const subscription = vi.hoisted(() => ({
	options: undefined as undefined | { onChange: (version: number) => void },
	stop: vi.fn(),
}))
vi.mock('@/shared/lib/feature-flags/subscribe', () => ({
	subscribeToFeatureFlags: (options: { onChange: (version: number) => void }) => {
		subscription.options = options
		return subscription.stop
	},
}))
vi.mock('@/shared/lib/feature-flags/feature-flags-service', () => ({
	featureFlagsService: { snapshot: vi.fn(), access: vi.fn() },
}))
const makeSnapshot = (version: number, boards = true): FeatureFlagsSnapshot => ({
	version,
	flags: Object.values(FEATURE_KEYS).map((key) => ({
		key,
		enabled: key !== 'boards' || boards,
		updatedAt: '2026-10-10T00:00:00.000Z',
	})),
})
function mount() {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false, retryDelay: 0 } },
	})
	const result = render(
		<QueryClientProvider client={client}>
			<FeatureFlagsProvider>
				<FeatureGate feature='boards'>
					<div>Board content</div>
				</FeatureGate>
			</FeatureFlagsProvider>
		</QueryClientProvider>,
	)
	return { ...result, client }
}
describe('Runtime flag provider', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(featureFlagsService.snapshot).mockResolvedValue(makeSnapshot(1))
		vi.mocked(featureFlagsService.access).mockResolvedValue({ canManage: false })
	})
	afterEach(() => cleanup())
	it('updates an already mounted block after the server notification', async () => {
		const view = mount()
		await screen.findByText('Board content')
		vi.mocked(featureFlagsService.snapshot).mockResolvedValue(makeSnapshot(2, false))
		act(() => subscription.options!.onChange(2))
		await screen.findByText('Раздел временно недоступен')
		expect(screen.queryByText('Board content')).toBeNull()
		vi.mocked(featureFlagsService.snapshot).mockResolvedValue(makeSnapshot(3))
		act(() => subscription.options!.onChange(3))
		await screen.findByText('Board content')
		view.unmount()
		expect(subscription.stop).toHaveBeenCalled()
	})
	it('shows a neutral loading state before the first snapshot', () => {
		vi.mocked(featureFlagsService.snapshot).mockImplementation(
			() => new Promise(() => {}),
		)
		mount()
		expect(screen.getByLabelText('Загрузка доступных функций')).toBeDefined()
		expect(screen.queryByText('Board content')).toBeNull()
	})
	it('fails closed on a refresh error even with previously enabled cached data', async () => {
		mount()
		await screen.findByText('Board content')
		vi.mocked(featureFlagsService.snapshot).mockRejectedValue(
			new Error('API unavailable'),
		)
		act(() => subscription.options!.onChange(2))
		await screen.findByText('Не удалось проверить доступность раздела.')
		expect(screen.queryByText('Board content')).toBeNull()
	})
	it('ignores duplicate or older version notifications', async () => {
		mount()
		await screen.findByText('Board content')
		const count = vi.mocked(featureFlagsService.snapshot).mock.calls.length
		act(() => {
			subscription.options!.onChange(1)
			subscription.options!.onChange(0)
		})
		await waitFor(() => expect(featureFlagsService.snapshot).toHaveBeenCalledTimes(count))
	})
})
