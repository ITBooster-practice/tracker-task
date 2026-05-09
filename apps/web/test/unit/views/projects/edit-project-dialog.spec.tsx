import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { EditProjectDialog } from '@/views/projects/ui/edit-project-dialog'

const mockMutateAsync = vi.fn()

vi.mock('@/shared/api/use-projects', () => ({
	useUpdateProject: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}))

vi.mock('@/shared/lib/api/utils', () => ({
	isApiError: () => false,
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
	Wrapper.displayName = 'EditProjectDialogWrapper'
	return Wrapper
}

describe('EditProjectDialog', () => {
	const mockOnOpenChange = vi.fn()

	beforeEach(() => {
		vi.clearAllMocks()
		mockMutateAsync.mockResolvedValue({})
	})

	afterEach(cleanup)

	it('не рендерится когда open=false', () => {
		render(
			<EditProjectDialog
				teamId='team-1'
				projectId='project-1'
				initialName='My Project'
				initialDescription='Описание'
				open={false}
				onOpenChange={mockOnOpenChange}
			/>,
			{ wrapper: createWrapper() },
		)

		expect(screen.queryByTestId('dialog')).toBeNull()
	})

	it('рендерит форму с заголовком когда open=true', () => {
		render(
			<EditProjectDialog
				teamId='team-1'
				projectId='project-1'
				initialName='My Project'
				initialDescription='Описание'
				open={true}
				onOpenChange={mockOnOpenChange}
			/>,
			{ wrapper: createWrapper() },
		)

		expect(screen.getByText('Редактировать проект')).toBeDefined()
	})

	it('поля предзаполнены начальными значениями', () => {
		render(
			<EditProjectDialog
				teamId='team-1'
				projectId='project-1'
				initialName='My Project'
				initialDescription='Описание'
				open={true}
				onOpenChange={mockOnOpenChange}
			/>,
			{ wrapper: createWrapper() },
		)

		const inputs = screen.getAllByRole('textbox') as HTMLInputElement[]
		expect(inputs[0].value).toBe('My Project')
		expect(inputs[1].value).toBe('Описание')
	})

	it('submit вызывает mutate с teamId, projectId и данными', () => {
		render(
			<EditProjectDialog
				teamId='team-1'
				projectId='project-1'
				initialName='My Project'
				initialDescription='Описание'
				open={true}
				onOpenChange={mockOnOpenChange}
			/>,
			{ wrapper: createWrapper() },
		)

		fireEvent.submit(screen.getByTestId('dialog').querySelector('form')!)

		expect(mockMutateAsync).toHaveBeenCalledWith({
			teamId: 'team-1',
			projectId: 'project-1',
			data: { name: 'My Project', description: 'Описание' },
		})
	})

	it('submit с пустым именем — mutate не вызывается', () => {
		render(
			<EditProjectDialog
				teamId='team-1'
				projectId='project-1'
				initialName=''
				initialDescription=''
				open={true}
				onOpenChange={mockOnOpenChange}
			/>,
			{ wrapper: createWrapper() },
		)

		fireEvent.submit(screen.getByTestId('dialog').querySelector('form')!)

		expect(mockMutateAsync).not.toHaveBeenCalled()
	})

	it('кнопка Отмена вызывает onOpenChange(false)', () => {
		render(
			<EditProjectDialog
				teamId='team-1'
				projectId='project-1'
				initialName='My Project'
				initialDescription=''
				open={true}
				onOpenChange={mockOnOpenChange}
			/>,
			{ wrapper: createWrapper() },
		)

		fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))

		expect(mockOnOpenChange).toHaveBeenCalledWith(false)
	})
})
