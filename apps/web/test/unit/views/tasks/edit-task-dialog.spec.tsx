import '@/test/mocks/views/tasks/task-sheet.mock'

import { createTaskFixture } from '@/test/mocks/api/tasks.fixtures'
import { toastMock } from '@/test/mocks/views/tasks/task-sheet.mock'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { EditTaskDialog } from '@/views/tasks/ui/edit-task-dialog'

const updateMutateAsyncMock = vi.fn()

vi.mock('@/shared/api/use-tasks', () => ({
	useUpdateTask: () => ({
		mutateAsync: updateMutateAsyncMock,
		isPending: false,
	}),
}))

vi.mock('@/shared/api/use-team-members', () => ({
	useTeamMembers: () => ({
		data: { data: [] },
	}),
}))

describe('EditTaskDialog', () => {
	const task = createTaskFixture({
		id: 'task-1',
		title: 'Существующая задача',
		description: 'Описание задачи',
		status: 'IN_PROGRESS',
		priority: 'HIGH',
		assigneeId: null,
	})

	const defaultProps = {
		teamId: 'team-1',
		projectId: 'project-1',
		task,
		open: true,
		onOpenChange: vi.fn(),
	}

	beforeEach(() => {
		updateMutateAsyncMock.mockReset()
		toastMock.success.mockReset()
		toastMock.error.mockReset()
	})

	afterEach(cleanup)

	it('не рендерится когда open=false', () => {
		render(<EditTaskDialog {...defaultProps} open={false} />)
		expect(screen.queryByTestId('sheet')).toBeNull()
	})

	it('не показывает подзаголовок когда task=null', () => {
		render(<EditTaskDialog {...defaultProps} task={null} />)
		expect(screen.queryByText('Существующая задача')).toBeNull()
	})

	it('предзаполняет форму данными задачи', () => {
		render(<EditTaskDialog {...defaultProps} />)
		expect(screen.getByDisplayValue('Существующая задача')).toBeDefined()
		expect(screen.getByDisplayValue('Описание задачи')).toBeDefined()
	})

	it('обновляет задачу и показывает success toast', async () => {
		updateMutateAsyncMock.mockResolvedValue({})
		render(<EditTaskDialog {...defaultProps} />)

		fireEvent.change(screen.getByPlaceholderText('Название задачи'), {
			target: { value: 'Обновлённая задача' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

		await waitFor(() => expect(updateMutateAsyncMock).toHaveBeenCalledOnce())
		expect(updateMutateAsyncMock).toHaveBeenCalledWith(
			expect.objectContaining({
				taskId: 'task-1',
				data: expect.objectContaining({ title: 'Обновлённая задача' }),
			}),
		)
		expect(toastMock.success).toHaveBeenCalledWith('Задача обновлена')
	})

	it('показывает error toast при ошибке API', async () => {
		updateMutateAsyncMock.mockRejectedValue({ message: 'Не найдена', statusCode: 404 })
		render(<EditTaskDialog {...defaultProps} />)

		fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

		await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith('Не найдена'))
		expect(toastMock.success).not.toHaveBeenCalled()
	})

	it('закрывает диалог по кнопке Отмена', () => {
		const onOpenChange = vi.fn()
		render(<EditTaskDialog {...defaultProps} onOpenChange={onOpenChange} />)
		fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))
		expect(onOpenChange).toHaveBeenCalledWith(false)
	})

	it('кнопка сохранения заблокирована при пустом названии', () => {
		render(<EditTaskDialog {...defaultProps} />)
		fireEvent.change(screen.getByPlaceholderText('Название задачи'), {
			target: { value: '' },
		})
		expect(screen.getByRole('button', { name: 'Сохранить' })).toHaveProperty(
			'disabled',
			true,
		)
	})
})
