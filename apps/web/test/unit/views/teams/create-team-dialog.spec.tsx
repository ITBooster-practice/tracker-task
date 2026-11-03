import {
	installDesktopMatchMediaMock,
	restoreMatchMediaMock,
} from '@/test/mocks/browser/match-media.mock'
import {
	mockCreateTeamMutateAsync,
	mockIsApiError,
	mockRouterReplace,
	mockTeamCreatePendingState,
	mockToastError,
	resetCreateTeamDialogUnitMocks,
} from '@/test/mocks/views/teams/create-team-dialog.unit.mock'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CreateTeamDialog } from '@/views/teams/ui/create-team-dialog'

function holdDialogExit() {
	const getStyles = window.getComputedStyle.bind(window)
	vi.stubGlobal('CSS', { ...globalThis.CSS, escape: (value: string) => value })
	vi.stubGlobal('getComputedStyle', (element: Element, pseudo?: string | null) => {
		const styles = getStyles(element, pseudo)
		if (element.matches('[data-slot="dialog-content"]'))
			Object.defineProperty(styles, 'animationName', {
				get: () =>
					element.getAttribute('data-state') === 'closed' ? 'team-exit' : 'team-enter',
			})
		return styles
	})
}

function completeDialogExit(content: HTMLElement) {
	const event = new Event('animationend', { bubbles: true })
	Object.defineProperty(event, 'animationName', { value: 'team-exit' })
	fireEvent(content, event)
}

describe('CreateTeamDialog', () => {
	beforeEach(() => {
		resetCreateTeamDialogUnitMocks()
		installDesktopMatchMediaMock()
	})

	afterEach(() => {
		cleanup()
		restoreMatchMediaMock()
		vi.unstubAllGlobals()
	})

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

	it('submit с пробелами не вызывает mutateAsync', () => {
		render(<CreateTeamDialog />)

		fireEvent.change(screen.getByPlaceholderText('Например: Product Team'), {
			target: { value: '   ' },
		})
		fireEvent.submit(
			screen.getByPlaceholderText('Например: Product Team').closest('form')!,
		)

		expect(mockCreateTeamMutateAsync).not.toHaveBeenCalled()
	})

	it('успешный submit — редирект на /teams после завершения закрытия', async () => {
		holdDialogExit()
		mockCreateTeamMutateAsync.mockResolvedValue({ id: 'new-team', name: 'Design Team' })
		render(<CreateTeamDialog />)

		fireEvent.change(screen.getByPlaceholderText('Например: Product Team'), {
			target: { value: 'Design Team' },
		})
		fireEvent.submit(
			screen.getByPlaceholderText('Например: Product Team').closest('form')!,
		)

		const content = screen.getByRole('dialog')
		await waitFor(() => expect(content.getAttribute('data-state')).toBe('closed'))
		expect(mockRouterReplace).not.toHaveBeenCalled()
		expect(content.isConnected).toBe(true)
		completeDialogExit(content)
		await waitFor(() =>
			expect(mockRouterReplace).toHaveBeenCalledExactlyOnceWith('/teams'),
		)
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

	it('закрытие диалога через onOpenChange ведет на /teams', async () => {
		render(<CreateTeamDialog />)

		fireEvent.click(screen.getByRole('button', { name: 'Close' }))

		await waitFor(() => expect(mockRouterReplace).toHaveBeenCalledWith('/teams'))
	})

	it('pending состояние меняет текст кнопки на "Создание..."', () => {
		mockTeamCreatePendingState.value = true

		render(<CreateTeamDialog />)

		expect(screen.getByRole('button', { name: 'Создание...' })).toBeDefined()
		fireEvent.click(screen.getByRole('button', { name: 'Close' }))
		fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
		expect(screen.getByRole('dialog').getAttribute('data-state')).toBe('open')
		expect(mockRouterReplace).not.toHaveBeenCalled()
	})

	it('кнопка "Отмена" — редирект на /teams', async () => {
		render(<CreateTeamDialog />)

		fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))

		await waitFor(() => expect(mockRouterReplace).toHaveBeenCalledWith('/teams'))
	})
})
