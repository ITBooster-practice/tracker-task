import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CreateTeamDialog } from '@/views/teams/ui/create-team-dialog'

const { mockMutateAsync, mockReplace, mockIsApiError, mockToastError, mockIsPending } =
	vi.hoisted(() => ({
		mockMutateAsync: vi.fn(),
		mockReplace: vi.fn(),
		mockIsApiError: vi.fn(),
		mockToastError: vi.fn(),
		mockIsPending: { value: false },
	}))

vi.mock('@/shared/api/use-teams', () => ({
	useCreateTeam: () => ({
		mutateAsync: mockMutateAsync,
		get isPending() {
			return mockIsPending.value
		},
	}),
}))

vi.mock('next/navigation', () => ({
	useRouter: () => ({ replace: mockReplace }),
}))

vi.mock('@/shared/lib/api/utils', () => ({
	isApiError: mockIsApiError,
	toApiError: vi.fn(),
}))

vi.mock('@repo/ui', () => ({
	Button: ({
		children,
		...props
	}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
		<button {...props}>{children}</button>
	),
	DialogDrawer: ({
		children,
	}: React.PropsWithChildren<{ open: boolean; onOpenChange: (v: boolean) => void }>) => (
		<div data-testid='dialog'>{children}</div>
	),
	DialogDrawerContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	DialogDrawerHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	DialogDrawerTitle: ({ children }: React.PropsWithChildren) => <h2>{children}</h2>,
	DialogDrawerDescription: ({ children }: React.PropsWithChildren) => <p>{children}</p>,
	DialogDrawerFooter: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
	Label: ({
		children,
		...props
	}: React.PropsWithChildren<React.LabelHTMLAttributes<HTMLLabelElement>>) => (
		<label {...props}>{children}</label>
	),
	toast: { error: mockToastError },
}))

describe('CreateTeamDialog', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockIsPending.value = false
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
		mockMutateAsync.mockResolvedValue({ id: 'new-team', name: 'Design Team' })
		render(<CreateTeamDialog />)

		fireEvent.change(screen.getByPlaceholderText('Например: Product Team'), {
			target: { value: '  Design Team  ' },
		})
		fireEvent.submit(
			screen.getByPlaceholderText('Например: Product Team').closest('form')!,
		)

		await waitFor(() => {
			expect(mockMutateAsync).toHaveBeenCalledWith({ name: 'Design Team' })
		})
	})

	it('успешный submit — редирект на /teams', async () => {
		mockMutateAsync.mockResolvedValue({ id: 'new-team', name: 'Design Team' })
		render(<CreateTeamDialog />)

		fireEvent.change(screen.getByPlaceholderText('Например: Product Team'), {
			target: { value: 'Design Team' },
		})
		fireEvent.submit(
			screen.getByPlaceholderText('Например: Product Team').closest('form')!,
		)

		await waitFor(() => {
			expect(mockReplace).toHaveBeenCalledWith('/teams')
		})
	})

	it('API ошибка — показывает toast.error', async () => {
		const apiError = { message: 'Команда с таким именем уже существует', statusCode: 409 }
		mockMutateAsync.mockRejectedValue(apiError)
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

		expect(mockReplace).toHaveBeenCalledWith('/teams')
	})
})
