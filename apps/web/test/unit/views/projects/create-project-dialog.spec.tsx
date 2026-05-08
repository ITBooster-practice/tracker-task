import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CreateProjectDialog } from '@/views/projects/ui/create-project-dialog'

const mockMutateAsync = vi.fn()

vi.mock('@/shared/api/use-projects', () => ({
	useCreateProject: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
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
	toast: { success: vi.fn(), error: vi.fn() },
}))

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	})
	const Wrapper = ({ children }: React.PropsWithChildren) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	)
	Wrapper.displayName = 'CreateProjectDialogWrapper'
	return Wrapper
}

describe('CreateProjectDialog', () => {
	const mockOnOpenChange = vi.fn()

	beforeEach(() => {
		vi.clearAllMocks()
		mockMutateAsync.mockResolvedValue({})
	})

	afterEach(cleanup)

	it('не рендерится когда open=false', () => {
		render(
			<CreateProjectDialog
				teamId='team-1'
				open={false}
				onOpenChange={mockOnOpenChange}
			/>,
			{ wrapper: createWrapper() },
		)

		expect(screen.queryByTestId('dialog')).toBeNull()
	})

	it('рендерит форму когда open=true', () => {
		render(
			<CreateProjectDialog teamId='team-1' open={true} onOpenChange={mockOnOpenChange} />,
			{ wrapper: createWrapper() },
		)

		expect(screen.getByText('Создать проект')).toBeDefined()
	})

	it('рендерит поле Название', () => {
		render(
			<CreateProjectDialog teamId='team-1' open={true} onOpenChange={mockOnOpenChange} />,
			{ wrapper: createWrapper() },
		)

		expect(screen.getByPlaceholderText('Мой проект')).toBeDefined()
	})

	it('кнопка "Создать" disabled при пустом названии', () => {
		render(
			<CreateProjectDialog teamId='team-1' open={true} onOpenChange={mockOnOpenChange} />,
			{ wrapper: createWrapper() },
		)

		expect(screen.getByRole('button', { name: 'Создать' })).toHaveProperty(
			'disabled',
			true,
		)
	})

	it('submit — вызывает mutate с teamId и name', () => {
		render(
			<CreateProjectDialog teamId='team-1' open={true} onOpenChange={mockOnOpenChange} />,
			{ wrapper: createWrapper() },
		)

		fireEvent.change(screen.getByPlaceholderText('Мой проект'), {
			target: { value: 'Новый проект' },
		})
		fireEvent.submit(screen.getByPlaceholderText('Мой проект').closest('form')!)

		expect(mockMutateAsync).toHaveBeenCalledWith({
			teamId: 'team-1',
			data: { name: 'Новый проект' },
		})
	})

	it('submit с пустым названием — mutate не вызывается', () => {
		render(
			<CreateProjectDialog teamId='team-1' open={true} onOpenChange={mockOnOpenChange} />,
			{ wrapper: createWrapper() },
		)

		fireEvent.submit(screen.getByTestId('dialog').querySelector('form')!)

		expect(mockMutateAsync).not.toHaveBeenCalled()
	})

	it('закрытие диалога — очищает поле названия', () => {
		const { rerender } = render(
			<CreateProjectDialog teamId='team-1' open={true} onOpenChange={mockOnOpenChange} />,
			{ wrapper: createWrapper() },
		)

		fireEvent.change(screen.getByPlaceholderText('Мой проект'), {
			target: { value: 'Тест' },
		})

		rerender(
			<CreateProjectDialog
				teamId='team-1'
				open={false}
				onOpenChange={mockOnOpenChange}
			/>,
		)
		rerender(
			<CreateProjectDialog teamId='team-1' open={true} onOpenChange={mockOnOpenChange} />,
		)

		expect((screen.getByPlaceholderText('Мой проект') as HTMLInputElement).value).toBe('')
	})
})
