import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CreateTaskDialog } from '@/views/tasks/ui/create-task-dialog'

const { replaceMock, createMutateAsyncMock, toastSuccess, toastError, isDesktopMock } =
	vi.hoisted(() => ({
		replaceMock: vi.fn(),
		createMutateAsyncMock: vi.fn(),
		toastSuccess: vi.fn(),
		toastError: vi.fn(),
		isDesktopMock: vi.fn(() => true),
	}))

vi.mock('next/navigation', () => ({
	useRouter: () => ({ replace: replaceMock }),
	useParams: () => ({ id: 'team-1', projectId: 'project-1' }),
}))

vi.mock('@repo/ui', () => ({
	useMediaQuery: isDesktopMock,
	Sheet: ({
		children,
		onOpenChange,
	}: React.PropsWithChildren<{ onOpenChange?: (open: boolean) => void }>) => (
		<div data-testid='sheet'>
			<button
				type='button'
				data-testid='sheet-close'
				onClick={() => onOpenChange?.(false)}
			>
				close
			</button>
			{children}
		</div>
	),
	SheetContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	SheetHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	SheetTitle: ({ children }: React.PropsWithChildren) => <h2>{children}</h2>,
	SheetDescription: ({ children }: React.PropsWithChildren) => <p>{children}</p>,
	SheetFooter: ({ children }: React.PropsWithChildren) => <footer>{children}</footer>,
	Drawer: ({
		children,
		onOpenChange,
	}: React.PropsWithChildren<{ onOpenChange?: (open: boolean) => void }>) => (
		<div data-testid='drawer'>
			<button
				type='button'
				data-testid='drawer-close'
				onClick={() => onOpenChange?.(false)}
			>
				close
			</button>
			{children}
		</div>
	),
	DrawerContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	DrawerHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	DrawerTitle: ({ children }: React.PropsWithChildren) => <h2>{children}</h2>,
	DrawerDescription: ({ children }: React.PropsWithChildren) => <p>{children}</p>,
	DrawerFooter: ({ children }: React.PropsWithChildren) => <footer>{children}</footer>,
	Button: ({
		children,
		...props
	}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
		<button {...props}>{children}</button>
	),
	toast: { success: toastSuccess, error: toastError },
	cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}))

vi.mock('@/shared/api/use-tasks', () => ({
	useCreateTask: () => ({
		mutateAsync: createMutateAsyncMock,
		isPending: false,
	}),
}))

vi.mock('@/shared/api/use-team-members', () => ({
	useTeamMembers: () => ({
		data: {
			data: [
				{ userId: 'user-1', name: 'Иван Иванов' },
				{ userId: 'user-2', name: 'Мария Петрова' },
			],
		},
	}),
}))

describe('CreateTaskDialog', () => {
	beforeEach(() => {
		replaceMock.mockReset()
		createMutateAsyncMock.mockReset()
		toastSuccess.mockReset()
		toastError.mockReset()
		isDesktopMock.mockReturnValue(true)
	})

	afterEach(cleanup)

	it('рендерит Sheet (десктоп)', () => {
		render(<CreateTaskDialog />)
		expect(screen.getByTestId('sheet')).toBeDefined()
		expect(screen.getByText('Создать задачу')).toBeDefined()
	})

	it('рендерит Drawer (мобилка)', () => {
		isDesktopMock.mockReturnValue(false)
		render(<CreateTaskDialog />)
		expect(screen.getByTestId('drawer')).toBeDefined()
		expect(screen.getByText('Создать задачу')).toBeDefined()
	})

	it('кнопка создания заблокирована при пустом названии', () => {
		render(<CreateTaskDialog />)
		expect(screen.getByRole('button', { name: 'Создать' })).toHaveProperty(
			'disabled',
			true,
		)
	})

	it('создаёт задачу с описанием и исполнителем', async () => {
		createMutateAsyncMock.mockResolvedValue({})
		render(<CreateTaskDialog />)

		fireEvent.change(screen.getByPlaceholderText('Название задачи'), {
			target: { value: 'Новая задача' },
		})
		fireEvent.change(screen.getByPlaceholderText('Описание задачи...'), {
			target: { value: 'Подробное описание' },
		})
		fireEvent.change(screen.getAllByRole('combobox')[1]!, {
			target: { value: 'user-1' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Создать' }))

		await waitFor(() => expect(createMutateAsyncMock).toHaveBeenCalledOnce())
		expect(createMutateAsyncMock).toHaveBeenCalledWith({
			teamId: 'team-1',
			projectId: 'project-1',
			data: expect.objectContaining({
				title: 'Новая задача',
				description: 'Подробное описание',
				assigneeId: 'user-1',
			}),
		})
		expect(toastSuccess).toHaveBeenCalledWith('Задача создана')
		expect(replaceMock).toHaveBeenCalledWith(expect.stringContaining('/tasks'))
	})

	it('создаёт задачу только с названием', async () => {
		createMutateAsyncMock.mockResolvedValue({})
		render(<CreateTaskDialog />)

		fireEvent.change(screen.getByPlaceholderText('Название задачи'), {
			target: { value: 'Новая задача' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Создать' }))

		await waitFor(() => expect(createMutateAsyncMock).toHaveBeenCalledOnce())
		expect(toastSuccess).toHaveBeenCalledWith('Задача создана')
		expect(replaceMock).toHaveBeenCalledWith(expect.stringContaining('/tasks'))
	})

	it('показывает error toast при ошибке API', async () => {
		createMutateAsyncMock.mockRejectedValue({ message: 'Ошибка', statusCode: 500 })
		render(<CreateTaskDialog />)

		fireEvent.change(screen.getByPlaceholderText('Название задачи'), {
			target: { value: 'Задача' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Создать' }))

		await waitFor(() => expect(toastError).toHaveBeenCalledWith('Ошибка'))
		expect(replaceMock).not.toHaveBeenCalled()
	})

	it('кнопка Отмена редиректит на список', () => {
		render(<CreateTaskDialog />)
		fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))
		expect(replaceMock).toHaveBeenCalledWith(expect.stringContaining('/tasks'))
	})

	it('закрывает Sheet через onOpenChange(false)', () => {
		render(<CreateTaskDialog />)
		fireEvent.click(screen.getByTestId('sheet-close'))
		expect(replaceMock).toHaveBeenCalledWith(expect.stringContaining('/tasks'))
	})

	it('закрывает Drawer через onOpenChange(false)', () => {
		isDesktopMock.mockReturnValue(false)
		render(<CreateTaskDialog />)
		fireEvent.click(screen.getByTestId('drawer-close'))
		expect(replaceMock).toHaveBeenCalledWith(expect.stringContaining('/tasks'))
	})

	it('отображает участников в списке исполнителей', () => {
		render(<CreateTaskDialog />)
		expect(screen.getByText('Иван Иванов')).toBeDefined()
		expect(screen.getByText('Мария Петрова')).toBeDefined()
	})
})
