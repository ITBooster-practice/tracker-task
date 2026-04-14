import {
	mockCreateTeamMutateAsync,
	mockIsApiError,
	mockRouterReplace,
	mockToastError,
	resetCreateTeamDialogUnitMocks,
} from '@/test/mocks/views/teams/create-team-dialog.unit.mock'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { CreateTeamDialog } from '@/views/teams/ui/create-team-dialog'

describe('CreateTeamDialog', () => {
	beforeEach(() => {
		resetCreateTeamDialogUnitMocks()
	})

	afterEach(cleanup)

	it('отображает заголовок диалога', () => {
		render(<CreateTeamDialog />)

		expect(screen.getByText('Создать команду')).toBeDefined()
	})

	it('отображает поле для ввода названия', () => {
		render(<CreateTeamDialog />)

		expect(screen.getByPlaceholderText('Например: Product Team')).toBeDefined()
	})

	it('кнопка "Создать" disabled при пустом поле', () => {
		render(<CreateTeamDialog />)

		const submitButton = screen.getByRole('button', { name: 'Создать' })
		expect(submitButton).toHaveProperty('disabled', true)
	})

	it('кнопка "Создать" активна при заполненном поле', () => {
		render(<CreateTeamDialog />)

		fireEvent.change(screen.getByPlaceholderText('Например: Product Team'), {
			target: { value: 'Design Team' },
		})

		const submitButton = screen.getByRole('button', { name: 'Создать' })
		expect(submitButton).toHaveProperty('disabled', false)
	})

	it('submit — вызывает mutateAsync с trimmed-именем', async () => {
		mockCreateTeamMutateAsync.mockResolvedValue({ id: 'new-team', name: 'Design Team' })
		render(<CreateTeamDialog />)

		fireEvent.change(screen.getByPlaceholderText('Например: Product Team'), {
			target: { value: '  Design Team  ' },
		})
		fireEvent.submit(
			screen.getByPlaceholderText('Например: Product Team').closest('form')!,
		)

		await waitFor(() => {
			expect(mockCreateTeamMutateAsync).toHaveBeenCalledWith({ name: 'Design Team' })
		})
	})

	it('успешный submit — редирект на /teams', async () => {
		mockCreateTeamMutateAsync.mockResolvedValue({ id: 'new-team', name: 'Design Team' })
		render(<CreateTeamDialog />)

		fireEvent.change(screen.getByPlaceholderText('Например: Product Team'), {
			target: { value: 'Design Team' },
		})
		fireEvent.submit(
			screen.getByPlaceholderText('Например: Product Team').closest('form')!,
		)

		await waitFor(() => {
			expect(mockRouterReplace).toHaveBeenCalledWith('/teams')
		})
	})

	it('API ошибка — показывает toast.error', async () => {
		const apiError = { message: 'Команда с таким именем уже существует', statusCode: 409 }
		mockCreateTeamMutateAsync.mockRejectedValue(apiError)
		mockIsApiError.mockReturnValue(true)

		render(<CreateTeamDialog />)

		fireEvent.change(screen.getByPlaceholderText('Например: Product Team'), {
			target: { value: 'Existing Team' },
		})
		fireEvent.submit(
			screen.getByPlaceholderText('Например: Product Team').closest('form')!,
		)

		await waitFor(() => {
			expect(mockToastError).toHaveBeenCalledWith('Команда с таким именем уже существует')
		})
	})

	it('кнопка "Отмена" — редирект на /teams', () => {
		render(<CreateTeamDialog />)

		fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))

		expect(mockRouterReplace).toHaveBeenCalledWith('/teams')
	})
})
