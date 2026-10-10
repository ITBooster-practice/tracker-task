import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { FeatureFlag } from '@repo/types'

import { FeatureFlagForm } from '@/views/feature-flags/ui/feature-flag-form'

beforeEach(() => {
	// Radix Checkbox measures its hidden input; jsdom has no ResizeObserver.
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
		fireEvent.click(screen.getByLabelText('Плановая дата завершения'))
		fireEvent.click(screen.getByRole('button', { name: /следующ/i }))
		fireEvent.click(screen.getByRole('button', { name: /10 ноября 2026/i }))
		fireEvent.change(screen.getByLabelText('Время завершения'), {
			target: { value: '12:00' },
		})
		fireEvent.click(screen.getByLabelText('Функция включена'))
		fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
		await waitFor(() =>
			expect(onSubmit).toHaveBeenCalledWith({
				key: 'search-v2',
				title: 'Search',
				enabled: true,
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
			expect(onSubmit).toHaveBeenLastCalledWith(
				expect.objectContaining({ expiresAt, enabled: true }),
			),
		)
		onSubmit.mockClear()
		fireEvent.change(screen.getByLabelText('Время завершения'), { target: { value: '' } })
		fireEvent.submit(screen.getByRole('button', { name: 'Сохранить' }).closest('form')!)
		expect(onSubmit).not.toHaveBeenCalled()
		expect(screen.getByRole('alert').textContent).toContain('дату и время')
		fireEvent.click(screen.getByRole('button', { name: 'Убрать дату' }))
		fireEvent.click(screen.getByRole('checkbox', { name: 'Функция включена' }))
		fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
		await waitFor(() =>
			expect(onSubmit).toHaveBeenLastCalledWith(
				expect.objectContaining({ expiresAt: null, enabled: false }),
			),
		)
	})
})
