import '@/test/mocks/views/tasks/task-sheet.mock'

import { toastMock } from '@/test/mocks/views/tasks/task-sheet.mock'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CreateTaskSheet } from '@/views/tasks/ui/create-task-sheet'

const createMutateAsyncMock = vi.fn()

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

describe('CreateTaskSheet', () => {
	const defaultProps = {
		teamId: 'team-1',
		projectId: 'project-1',
		open: true,
		onOpenChange: vi.fn(),
	}

	beforeEach(() => {
		createMutateAsyncMock.mockReset()
		toastMock.success.mockReset()
		toastMock.error.mockReset()
	})

	afterEach(cleanup)

	it('не рендерится когда open=false', () => {
		render(<CreateTaskSheet {...defaultProps} open={false} />)
		expect(screen.queryByTestId('sheet')).toBeNull()
	})

	it('кнопка создания заблокирована при пустом названии', () => {
		render(<CreateTaskSheet {...defaultProps} />)
		expect(screen.getByRole('button', { name: 'Создать' })).toHaveProperty(
			'disabled',
			true,
		)
	})

	it('кнопка создания разблокируется при вводе названия', () => {
		render(<CreateTaskSheet {...defaultProps} />)
		fireEvent.change(screen.getByPlaceholderText('Название задачи'), {
			target: { value: 'Новая задача' },
		})
		expect(screen.getByRole('button', { name: 'Создать' })).toHaveProperty(
			'disabled',
			false,
		)
	})

	it('создаёт задачу и показывает success toast', async () => {
		createMutateAsyncMock.mockResolvedValue({})
		render(<CreateTaskSheet {...defaultProps} />)

		fireEvent.change(screen.getByPlaceholderText('Название задачи'), {
			target: { value: '  Новая задача  ' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Создать' }))

		await waitFor(() => expect(createMutateAsyncMock).toHaveBeenCalledOnce())
		expect(createMutateAsyncMock).toHaveBeenCalledWith({
			teamId: 'team-1',
			projectId: 'project-1',
			data: expect.objectContaining({ title: 'Новая задача' }),
		})
		expect(toastMock.success).toHaveBeenCalledWith('Задача создана')
	})

	it('показывает error toast при ошибке API', async () => {
		createMutateAsyncMock.mockRejectedValue({
			message: 'Ошибка сервера',
			statusCode: 500,
		})
		render(<CreateTaskSheet {...defaultProps} />)

		fireEvent.change(screen.getByPlaceholderText('Название задачи'), {
			target: { value: 'Задача' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Создать' }))

		await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith('Ошибка сервера'))
		expect(toastMock.success).not.toHaveBeenCalled()
	})

	it('закрывает форму по кнопке Отмена', () => {
		const onOpenChange = vi.fn()
		render(<CreateTaskSheet {...defaultProps} onOpenChange={onOpenChange} />)
		fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))
		expect(onOpenChange).toHaveBeenCalledWith(false)
	})

	it('отображает участников в списке исполнителей', () => {
		render(<CreateTaskSheet {...defaultProps} />)
		expect(screen.getByText('Иван Иванов')).toBeDefined()
		expect(screen.getByText('Мария Петрова')).toBeDefined()
	})
})
