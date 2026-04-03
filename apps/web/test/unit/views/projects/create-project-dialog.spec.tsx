import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CreateProjectDialog } from '@/views/projects/ui/create-project-dialog'

// ─── Мок: утилиты проекта ────────────────────────────────────────
vi.mock('@/shared/lib/projects', () => ({
	isValidProjectCode: (code: string) => code.length >= 2 && code.length <= 5,
	normalizeProjectCodeInput: (value: string) =>
		value.toUpperCase().replace(/[^A-Z]/g, ''),
	PROJECT_CODE_MIN_LENGTH: 2,
	PROJECT_CODE_MAX_LENGTH: 5,
}))

// ─── Мок: UI-компоненты ──────────────────────────────────────────
vi.mock('@repo/ui', () => ({
	Button: ({
		children,
		...props
	}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
		<button {...props}>{children}</button>
	),
	DialogDrawer: ({
		children,
		open,
	}: React.PropsWithChildren<{ open: boolean; onOpenChange: (v: boolean) => void }>) =>
		open ? <div data-testid='dialog'>{children}</div> : null,
	DialogDrawerContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	DialogDrawerHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	DialogDrawerTitle: ({ children }: React.PropsWithChildren) => <h2>{children}</h2>,
	DialogDrawerFooter: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
	Label: ({
		children,
		...props
	}: React.PropsWithChildren<React.LabelHTMLAttributes<HTMLLabelElement>>) => (
		<label {...props}>{children}</label>
	),
	VStack: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}))

describe('CreateProjectDialog', () => {
	const mockOnCreate = vi.fn()
	const mockOnOpenChange = vi.fn()

	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(cleanup)

	it('не рендерится когда open=false', () => {
		render(
			<CreateProjectDialog
				open={false}
				onOpenChange={mockOnOpenChange}
				onCreate={mockOnCreate}
			/>,
		)

		expect(screen.queryByTestId('dialog')).toBeNull()
	})

	it('рендерит форму когда open=true', () => {
		render(
			<CreateProjectDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onCreate={mockOnCreate}
			/>,
		)

		expect(screen.getByText('Создать проект')).toBeDefined()
	})

	it('рендерит поля Название и Ключ', () => {
		render(
			<CreateProjectDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onCreate={mockOnCreate}
			/>,
		)

		expect(screen.getByPlaceholderText('Мой проект')).toBeDefined()
		expect(screen.getByPlaceholderText('MP')).toBeDefined()
	})

	it('кнопка "Создать" disabled при пустых полях', () => {
		render(
			<CreateProjectDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onCreate={mockOnCreate}
			/>,
		)

		expect(screen.getByRole('button', { name: 'Создать' })).toHaveProperty(
			'disabled',
			true,
		)
	})

	it('ввод кода нормализуется (uppercase, только латиница)', () => {
		render(
			<CreateProjectDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onCreate={mockOnCreate}
			/>,
		)

		fireEvent.change(screen.getByPlaceholderText('MP'), {
			target: { value: 'abc123' },
		})

		expect((screen.getByPlaceholderText('MP') as HTMLInputElement).value).toBe('ABC')
	})

	it('submit — вызывает onCreate с name и code', () => {
		render(
			<CreateProjectDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onCreate={mockOnCreate}
			/>,
		)

		fireEvent.change(screen.getByPlaceholderText('Мой проект'), {
			target: { value: 'Новый проект' },
		})
		fireEvent.change(screen.getByPlaceholderText('MP'), {
			target: { value: 'NP' },
		})
		fireEvent.submit(screen.getByPlaceholderText('Мой проект').closest('form')!)

		expect(mockOnCreate).toHaveBeenCalledWith({ name: 'Новый проект', code: 'NP' })
	})

	it('submit c невалидным кодом — onCreate не вызывается', () => {
		render(
			<CreateProjectDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onCreate={mockOnCreate}
			/>,
		)

		fireEvent.change(screen.getByPlaceholderText('Мой проект'), {
			target: { value: 'Новый проект' },
		})
		// Код слишком короткий — 1 символ (< минимума 2)
		fireEvent.change(screen.getByPlaceholderText('MP'), {
			target: { value: 'N' },
		})
		fireEvent.submit(screen.getByPlaceholderText('Мой проект').closest('form')!)

		expect(mockOnCreate).not.toHaveBeenCalled()
	})

	it('закрытие диалога — очищает поля', () => {
		const { rerender } = render(
			<CreateProjectDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onCreate={mockOnCreate}
			/>,
		)

		fireEvent.change(screen.getByPlaceholderText('Мой проект'), {
			target: { value: 'Тест' },
		})

		// Закрываем и переоткрываем
		rerender(
			<CreateProjectDialog
				open={false}
				onOpenChange={mockOnOpenChange}
				onCreate={mockOnCreate}
			/>,
		)
		rerender(
			<CreateProjectDialog
				open={true}
				onOpenChange={mockOnOpenChange}
				onCreate={mockOnCreate}
			/>,
		)

		expect((screen.getByPlaceholderText('Мой проект') as HTMLInputElement).value).toBe('')
	})
})
