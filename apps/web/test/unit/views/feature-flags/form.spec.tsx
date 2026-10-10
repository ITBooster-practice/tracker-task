import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FeatureFlagForm } from '@/views/feature-flags/ui/feature-flag-form'

afterEach(cleanup)
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
		fireEvent.change(screen.getByLabelText('Плановая дата завершения'), {
			target: { value: '2026-11-10T12:00' },
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
})
