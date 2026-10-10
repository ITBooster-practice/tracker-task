import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { FeatureFlag } from '@repo/types'

import { FeatureFlagsPageView } from '@/views/feature-flags'
import { FeatureFlagsContext } from '@/shared/lib/feature-flags/context'
import { featureFlagsService } from '@/shared/lib/feature-flags/feature-flags-service'

vi.mock('@/shared/lib/feature-flags/feature-flags-service', () => ({
	featureFlagsService: {
		list: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		archive: vi.fn(),
		audit: vi.fn(),
	},
}))
const flag: FeatureFlag = {
	id: 'flag-1',
	key: 'new-dashboard-v2',
	title: 'Новая панель',
	enabled: false,
	description: null,
	expiresAt: null,
	archivedAt: null,
	createdById: 'developer',
	createdAt: '2026-10-10T00:00:00.000Z',
	updatedAt: '2026-10-10T00:00:00.000Z',
	required: false,
}
function mount(canManage = true) {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	})
	return render(
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
}
describe('Developer flag panel', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(featureFlagsService.list).mockResolvedValue({ version: 5, flags: [flag] })
		vi.mocked(featureFlagsService.create).mockResolvedValue({ version: 6, flag })
		vi.mocked(featureFlagsService.update).mockResolvedValue({ version: 6, flag })
		vi.mocked(featureFlagsService.archive).mockResolvedValue({
			version: 6,
			flag: { ...flag, archivedAt: flag.createdAt },
		})
		vi.mocked(featureFlagsService.audit).mockResolvedValue([
			{
				id: 'audit-1',
				flagId: flag.id,
				actorId: 'developer',
				action: 'CREATE',
				before: null,
				after: flag,
				version: 5,
				createdAt: flag.createdAt,
			},
		])
	})
	afterEach(cleanup)
	it('denies ordinary users without requesting the private list', () => {
		mount(false)
		expect(screen.getByText('Доступ запрещён')).toBeDefined()
		expect(featureFlagsService.list).not.toHaveBeenCalled()
	})
	it('creates a disabled flag with a permanent technical key', async () => {
		mount()
		await screen.findByText(flag.title)
		fireEvent.click(screen.getByRole('button', { name: 'Создать флаг' }))
		fireEvent.change(screen.getByLabelText('Технический ключ'), {
			target: { value: 'new-search-v1' },
		})
		fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Поиск' } })
		fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
		await waitFor(() =>
			expect(featureFlagsService.create).toHaveBeenCalledWith({
				key: 'new-search-v1',
				title: 'Поиск',
				enabled: false,
				description: null,
				expiresAt: null,
			}),
		)
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
	})
	it('toggles using the current revision and waits for acknowledgment', async () => {
		let resolve!: (value: { version: number; flag: FeatureFlag }) => void
		vi.mocked(featureFlagsService.update).mockImplementation(
			() =>
				new Promise((done) => {
					resolve = done
				}),
		)
		mount()
		fireEvent.click(await screen.findByRole('button', { name: 'Включить ' + flag.title }))
		await waitFor(() =>
			expect(featureFlagsService.update).toHaveBeenCalledWith(flag.id, {
				enabled: true,
				expectedVersion: 5,
			}),
		)
		expect(
			screen
				.getByRole('button', { name: 'Включить ' + flag.title })
				.hasAttribute('disabled'),
		).toBe(true)
		resolve({ version: 6, flag: { ...flag, enabled: true } })
	})
	it('keeps the technical key read-only when editing and excludes it from PATCH', async () => {
		mount()
		fireEvent.click(
			await screen.findByRole('button', { name: 'Редактировать ' + flag.title }),
		)
		expect(screen.getByLabelText('Технический ключ').hasAttribute('readonly')).toBe(true)
		fireEvent.change(screen.getByLabelText('Название'), {
			target: { value: 'Другое название' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
		await waitFor(() =>
			expect(featureFlagsService.update).toHaveBeenCalledWith(flag.id, {
				title: 'Другое название',
				enabled: false,
				description: null,
				expiresAt: null,
				expectedVersion: 5,
			}),
		)
	})
	it('requires confirmation before archive and preserves access to audit', async () => {
		mount()
		fireEvent.click(
			await screen.findByRole('button', { name: 'Архивировать ' + flag.title }),
		)
		expect(featureFlagsService.archive).not.toHaveBeenCalled()
		fireEvent.click(
			within(screen.getByRole('dialog')).getByRole('button', { name: 'Архивировать' }),
		)
		await waitFor(() =>
			expect(featureFlagsService.archive).toHaveBeenCalledWith(flag.id, 5),
		)
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
		fireEvent.click(screen.getByRole('button', { name: 'История ' + flag.title }))
		await screen.findByText(/Создан · Автор: developer/)
		expect(featureFlagsService.audit).toHaveBeenCalledWith(flag.id)
	})
	it('prevents archiving flags still required by application code', async () => {
		vi.mocked(featureFlagsService.list).mockResolvedValue({
			version: 5,
			flags: [{ ...flag, required: true }],
		})
		mount()
		expect(
			(
				await screen.findByRole('button', { name: 'Архивировать ' + flag.title })
			).hasAttribute('disabled'),
		).toBe(true)
	})
	it('reports concurrent edits and refreshes rather than overwriting', async () => {
		vi.mocked(featureFlagsService.update).mockRejectedValue({
			message: 'Conflict',
			statusCode: 409,
		})
		mount()
		fireEvent.click(await screen.findByRole('button', { name: 'Включить ' + flag.title }))
		await screen.findByText(/Данные изменились или ключ уже занят/)
		await waitFor(() => expect(featureFlagsService.list).toHaveBeenCalledTimes(2))
	})
	it('filters archived flags separately and searches by key', async () => {
		vi.mocked(featureFlagsService.list).mockResolvedValue({
			version: 5,
			flags: [
				flag,
				{
					...flag,
					id: 'old',
					key: 'old-key',
					title: 'Архивная панель',
					archivedAt: flag.createdAt,
				},
			],
		})
		mount()
		await screen.findByText(flag.title)
		expect(screen.queryByText('Архивная панель')).toBeNull()
		fireEvent.change(screen.getByLabelText('Состояние'), {
			target: { value: 'archived' },
		})
		expect(screen.getByText('Архивная панель')).toBeDefined()
		fireEvent.change(screen.getByLabelText('Поиск по названию или ключу'), {
			target: { value: 'old-key' },
		})
		expect(screen.getByText('Архивная панель')).toBeDefined()
	})
})
