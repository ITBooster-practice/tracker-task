import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { FeatureFlag } from '@repo/types'

import { FeatureFlagForm } from '@/views/feature-flags/ui/feature-flag-form'

const clock = vi.hoisted(() => ({
	now: new Date(2026, 9, 10, 12, 34, 30) as Date | null,
	isError: false,
	retry: vi.fn(),
}))
vi.mock('@/shared/lib/feature-flags/use-server-clock', () => ({
	useServerClock: () => clock,
}))

beforeEach(() => {
	clock.now = new Date(2026, 9, 10, 12, 34, 30)
	clock.isError = false
	// Radix измеряет элементы; в jsdom нет ResizeObserver.
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe = vi.fn()
			unobserve = vi.fn()
			disconnect = vi.fn()
		},
	)
})
afterEach(() => {
	cleanup()
	vi.unstubAllGlobals()
	vi.useRealTimers()
})
describe('Feature flag form', () => {
	it('создаёт заготовку без переключателя состояния', () => {
		render(
			<FeatureFlagForm
				flag={null}
				pending={false}
				error=''
				onSubmit={vi.fn()}
				onCancel={vi.fn()}
			/>,
		)
		expect(screen.queryByRole('checkbox')).toBeNull()
		expect(screen.queryByText(/Новый флаг будет выключен/)).toBeNull()
	})
	it('blocks newly expired deadlines at submit and date selection without server time', () => {
		const onSubmit = vi.fn()
		const { rerender } = render(
			<FeatureFlagForm
				flag={null}
				pending={false}
				error=''
				onSubmit={onSubmit}
				onCancel={vi.fn()}
			/>,
		)
		fireEvent.change(screen.getByLabelText('Технический ключ'), {
			target: { value: 'search-v3' },
		})
		fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Поиск' } })
		fireEvent.change(screen.getByLabelText('Плановая дата завершения'), {
			target: { value: '10.10.2026' },
		})
		clock.now = new Date(2026, 9, 10, 12, 36)
		rerender(
			<FeatureFlagForm
				flag={null}
				pending={false}
				error=''
				onSubmit={onSubmit}
				onCancel={vi.fn()}
			/>,
		)
		fireEvent.submit(screen.getByRole('button', { name: 'Сохранить' }).closest('form')!)
		expect(onSubmit).not.toHaveBeenCalled()
		expect(screen.getByRole('alert').textContent).toContain('времени сервера')
		clock.now = null
		clock.isError = true
		rerender(
			<FeatureFlagForm
				flag={null}
				pending={false}
				error=''
				onSubmit={onSubmit}
				onCancel={vi.fn()}
			/>,
		)
		expect(
			(screen.getByRole('button', { name: 'Выбрать дату' }) as HTMLButtonElement)
				.disabled,
		).toBe(true)
		fireEvent.submit(screen.getByRole('button', { name: 'Сохранить' }).closest('form')!)
		expect(onSubmit).not.toHaveBeenCalled()
	})
	it('preserves the exact ISO timestamp of an unchanged past deadline', async () => {
		const expiresAt = new Date(2026, 9, 9, 12, 0, 45, 123).toISOString()
		const flag: FeatureFlag = {
			id: 'old',
			key: 'boards',
			title: 'Доски',
			description: null,
			enabled: false,
			expiresAt,
			archivedAt: null,
			required: true,
			connectedFeature: 'Доски',
			createdById: 'developer',
			createdAt: expiresAt,
			updatedAt: expiresAt,
		}
		const onSubmit = vi.fn().mockResolvedValue(undefined)
		render(
			<FeatureFlagForm
				flag={flag}
				pending={false}
				error=''
				onSubmit={onSubmit}
				onCancel={vi.fn()}
			/>,
		)
		fireEvent.change(screen.getByLabelText('Название'), {
			target: { value: 'Новое название' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
		await waitFor(() =>
			expect(onSubmit).toHaveBeenCalledWith(
				expect.objectContaining({ expiresAt, title: 'Новое название' }),
			),
		)
	})
	it('validates the permanent key before calling the API', async () => {
		const onSubmit = vi.fn()
		render(
			<FeatureFlagForm
				flag={null}
				pending={false}
				error=''
				onSubmit={onSubmit}
				onCancel={vi.fn()}
			/>,
		)
		fireEvent.change(screen.getByLabelText('Технический ключ'), {
			target: { value: 'Invalid Key' },
		})
		fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Test' } })
		fireEvent.submit(screen.getByRole('button', { name: 'Сохранить' }).closest('form')!)
		expect(onSubmit).not.toHaveBeenCalled()
		expect(screen.getByRole('alert')).toBeDefined()
	})
	it('submits the planned date in ISO format and trims description', async () => {
		vi.setSystemTime(new Date(2026, 9, 10, 12))
		const onSubmit = vi.fn().mockResolvedValue(undefined),
			onCancel = vi.fn()
		render(
			<FeatureFlagForm
				flag={null}
				pending={false}
				error=''
				onSubmit={onSubmit}
				onCancel={onCancel}
			/>,
		)
		fireEvent.change(screen.getByLabelText('Технический ключ'), {
			target: { value: 'search-v2' },
		})
		fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Search' } })
		fireEvent.change(screen.getByLabelText('Описание и план завершения'), {
			target: { value: '  Release next month  ' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Выбрать дату' }))
		fireEvent.click(screen.getByRole('button', { name: /следующ/i }))
		fireEvent.click(screen.getByRole('button', { name: /10 ноября 2026/i }))
		fireEvent.change(screen.getByLabelText('Время завершения'), {
			target: { value: '12:00' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
		await waitFor(() =>
			expect(onSubmit).toHaveBeenCalledWith({
				key: 'search-v2',
				title: 'Search',
				description: 'Release next month',
				expiresAt: new Date('2026-11-10T12:00').toISOString(),
			}),
		)
		fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))
		expect(onCancel).toHaveBeenCalledOnce()
	})
	it('preserves a saved local time and can remove the planned date', async () => {
		const expiresAt = new Date(2026, 10, 10, 12).toISOString()
		const flag: FeatureFlag = {
			id: 'flag-1',
			key: 'search-v2',
			title: 'Поиск',
			enabled: true,
			description: null,
			expiresAt,
			archivedAt: null,
			required: false,
			connectedFeature: null,
			createdById: 'developer',
			createdAt: expiresAt,
			updatedAt: expiresAt,
		}
		const onSubmit = vi.fn().mockResolvedValue(undefined)
		render(
			<FeatureFlagForm
				flag={flag}
				pending={false}
				error=''
				onSubmit={onSubmit}
				onCancel={vi.fn()}
			/>,
		)
		expect((screen.getByLabelText('Время завершения') as HTMLInputElement).value).toBe(
			'12:00',
		)
		fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
		await waitFor(() =>
			expect(onSubmit).toHaveBeenLastCalledWith(expect.objectContaining({ expiresAt })),
		)
		expect(onSubmit.mock.calls[0]![0]).not.toHaveProperty('enabled')
		expect(screen.queryByRole('checkbox')).toBeNull()
		onSubmit.mockClear()
		fireEvent.change(screen.getByLabelText('Время завершения'), { target: { value: '' } })
		fireEvent.submit(screen.getByRole('button', { name: 'Сохранить' }).closest('form')!)
		expect(onSubmit).not.toHaveBeenCalled()
		expect(
			screen
				.getAllByRole('alert')
				.some((alert) => alert.textContent?.includes('дату и время')),
		).toBe(true)
		fireEvent.click(screen.getByRole('button', { name: 'Очистить дату' }))
		fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
		await waitFor(() =>
			expect(onSubmit).toHaveBeenLastCalledWith(
				expect.objectContaining({ expiresAt: null }),
			),
		)
	})
})
