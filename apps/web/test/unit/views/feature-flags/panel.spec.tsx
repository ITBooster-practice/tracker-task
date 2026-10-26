import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { FeatureFlag } from '@repo/types'

import { FeatureFlagsPageView } from '@/views/feature-flags'
import { featureFlagsKeys } from '@/shared/api/use-feature-flags'
import { FeatureFlagsContext } from '@/shared/lib/feature-flags/context'
import { featureFlagsService } from '@/shared/lib/feature-flags/feature-flags-service'

vi.mock('@/shared/lib/feature-flags/feature-flags-service', () => ({
	featureFlagsService: { list: vi.fn(), update: vi.fn() },
}))
const flag: FeatureFlag = {
	id: 'flag-1',
	key: 'boards',
	enabled: false,
	updatedAt: '2026-10-10T00:00:00.000Z',
	connectedFeature: 'Доски',
}
function mount(canManage = true) {
	const client = new QueryClient({
		defaultOptions: {
			queries: { retry: false, gcTime: Infinity },
			mutations: { retry: false },
		},
	})
	const view = render(
		<QueryClientProvider client={client}>
			<FeatureFlagsContext.Provider
				value={{
					canManage,
					status: 'ready',
					snapshot: null,
					connection: 'connected',
					retry: vi.fn(),
				}}
			>
				<FeatureFlagsPageView />
			</FeatureFlagsContext.Provider>
		</QueryClientProvider>,
	)
	return { ...view, client }
}
beforeEach(() => {
	vi.clearAllMocks()
	vi.mocked(featureFlagsService.list).mockResolvedValue({ version: 5, flags: [flag] })
	vi.mocked(featureFlagsService.update).mockResolvedValue({
		version: 6,
		flag: { ...flag, enabled: true },
	})
})
afterEach(cleanup)

describe('Developer flag panel', () => {
	it('shows the key, connection and state without lifecycle controls', async () => {
		mount()
		expect(await screen.findByRole('heading', { name: 'Доски' })).toBeDefined()
		expect(screen.getByText('boards')).toBeDefined()
		expect(screen.getByText('Подключён к приложению')).toBeDefined()
		expect(screen.getByRole('button', { name: 'Включить Доски' })).toBeDefined()
		for (const name of ['Создать флаг', 'Редактировать', 'Архивировать', 'История'])
			expect(screen.queryByRole('button', { name })).toBeNull()
		expect(screen.queryByText(/Автор:|План завершения:/)).toBeNull()
	})
	it('does not fetch management data without access', () => {
		mount(false)
		expect(screen.queryByRole('button', { name: 'Включить Доски' })).toBeNull()
		expect(featureFlagsService.list).not.toHaveBeenCalled()
	})
	it('toggles with the loaded version and refreshes list and runtime snapshot', async () => {
		const { client } = mount()
		client.setQueryData(featureFlagsKeys.snapshot, { version: 5, flags: [] })
		fireEvent.click(await screen.findByRole('button', { name: 'Включить Доски' }))
		await waitFor(() =>
			expect(featureFlagsService.update).toHaveBeenCalledWith(flag.id, {
				enabled: true,
				expectedVersion: 5,
			}),
		)
		await waitFor(() => expect(featureFlagsService.list).toHaveBeenCalledTimes(2))
		expect(client.getQueryState(featureFlagsKeys.snapshot)?.isInvalidated).toBe(true)
	})
	it('disables enabling an unconnected flag but permits switching an old enabled record off', async () => {
		vi.mocked(featureFlagsService.list).mockResolvedValue({
			version: 5,
			flags: [
				{ ...flag, connectedFeature: null, key: 'new-key' },
				{ ...flag, id: 'old', connectedFeature: null, key: 'old-key', enabled: true },
			],
		})
		mount()
		const enable = (await screen.findByRole('button', {
			name: 'Включить new-key',
		})) as HTMLButtonElement
		expect(enable.disabled).toBe(true)
		fireEvent.click(screen.getByRole('button', { name: 'Выключить old-key' }))
		await waitFor(() =>
			expect(featureFlagsService.update).toHaveBeenCalledWith('old', {
				enabled: false,
				expectedVersion: 5,
			}),
		)
	})
	it('locks controls until an in-flight change finishes', async () => {
		let resolve!: (value: { version: number; flag: FeatureFlag }) => void
		vi.mocked(featureFlagsService.update).mockReturnValue(
			new Promise((done) => {
				resolve = done
			}),
		)
		mount()
		const button = (await screen.findByRole('button', {
			name: 'Включить Доски',
		})) as HTMLButtonElement
		fireEvent.click(button)
		await waitFor(() => expect(button.disabled).toBe(true))
		fireEvent.click(button)
		expect(featureFlagsService.update).toHaveBeenCalledOnce()
		await act(async () => resolve({ version: 6, flag }))
	})
	it('refreshes after a conflict and keeps the server state visible', async () => {
		vi.mocked(featureFlagsService.update).mockRejectedValue({
			statusCode: 409,
			message: 'Conflict',
		})
		mount()
		fireEvent.click(await screen.findByRole('button', { name: 'Включить Доски' }))
		expect((await screen.findByRole('alert')).textContent).toContain(
			'Флаги уже изменились',
		)
		await waitFor(() => expect(featureFlagsService.list).toHaveBeenCalledTimes(2))
		expect(screen.getByText('Отключён')).toBeDefined()
	})
	it('revokes cached management access when a change is forbidden', async () => {
		vi.mocked(featureFlagsService.update).mockRejectedValue({
			statusCode: 403,
			message: 'Forbidden',
		})
		const { client } = mount()
		fireEvent.click(await screen.findByRole('button', { name: 'Включить Доски' }))
		await waitFor(() =>
			expect(client.getQueryData(featureFlagsKeys.access)).toEqual({ canManage: false }),
		)
	})
	it('searches by code label or technical key', async () => {
		mount()
		await screen.findByRole('heading', { name: 'Доски' })
		fireEvent.change(screen.getByLabelText('Поиск по названию или ключу'), {
			target: { value: 'BOARDS' },
		})
		expect(screen.getByRole('heading', { name: 'Доски' })).toBeDefined()
		fireEvent.change(screen.getByLabelText('Поиск по названию или ключу'), {
			target: { value: 'Доски' },
		})
		expect(screen.getByRole('heading', { name: 'Доски' })).toBeDefined()
		fireEvent.change(screen.getByLabelText('Поиск по названию или ключу'), {
			target: { value: 'missing' },
		})
		expect(screen.getByText('Флаги не найдены.')).toBeDefined()
	})
	it('shows a retryable load failure without any toggle', async () => {
		vi.mocked(featureFlagsService.list).mockRejectedValueOnce(
			new Error('Network failure'),
		)
		mount()
		expect((await screen.findByRole('alert')).textContent).toContain(
			'Не удалось загрузить',
		)
		expect(screen.queryByRole('button', { name: 'Включить Доски' })).toBeNull()
		fireEvent.click(screen.getByRole('button', { name: 'Повторить загрузку' }))
		expect(await screen.findByRole('button', { name: 'Включить Доски' })).toBeDefined()
		expect(screen.queryByRole('button', { name: 'Повторить загрузку' })).toBeNull()
	})
})
