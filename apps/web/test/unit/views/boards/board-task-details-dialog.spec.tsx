import {
	getBoardTaskDetailsDialogToastMocks,
	resetBoardTaskDetailsDialogUnitMocks,
} from '@/test/mocks/views/boards/board-task-details-dialog.mock'
import { createBoardTaskFixture } from '@/test/mocks/views/boards/board-ui.fixtures'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { BoardTask } from '@/views/boards/model/types'
import { BoardTaskDetailsDialog } from '@/views/boards/ui/board-task-details-dialog'

function setClipboardWriteMock(writeText: (value: string) => Promise<void>) {
	const writeTextMock = vi.fn(writeText)

	Object.defineProperty(navigator, 'clipboard', {
		configurable: true,
		value: {
			writeText: writeTextMock,
		},
	})

	return writeTextMock
}

function renderDialog({
	commentDraft = '',
	isSubmitDisabled = false,
	onCommentDraftChange = () => undefined,
	onDeleteTask = () => undefined,
	onEditTask = () => undefined,
	onOpenChange = () => undefined,
	onSubmitComment = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
	},
	task = createBoardTaskFixture(),
}: {
	commentDraft?: string
	isSubmitDisabled?: boolean
	onCommentDraftChange?: (value: string) => void
	onDeleteTask?: (task: BoardTask) => void
	onEditTask?: (task: BoardTask) => void
	onOpenChange?: (open: boolean) => void
	onSubmitComment?: (event: React.FormEvent<HTMLFormElement>) => void
	task?: BoardTask | null
} = {}) {
	return render(
		<BoardTaskDetailsDialog
			task={task}
			commentDraft={commentDraft}
			isSubmitDisabled={isSubmitDisabled}
			onCommentDraftChange={onCommentDraftChange}
			onDeleteTask={onDeleteTask}
			onEditTask={onEditTask}
			onOpenChange={onOpenChange}
			onSubmitComment={onSubmitComment}
		/>,
	)
}

describe('BoardTaskDetailsDialog', () => {
	beforeEach(() => {
		resetBoardTaskDetailsDialogUnitMocks()
	})

	afterEach(cleanup)

	it('не рендерит содержимое без выбранной задачи', () => {
		renderDialog({ task: null })

		expect(screen.queryByTestId('dialog-root')).toBeNull()
	})

	it('рендерит детали задачи, комментарии и форму комментария', () => {
		renderDialog({
			commentDraft: 'Черновик ответа',
			isSubmitDisabled: true,
		})

		expect(screen.getByTestId('dialog-root')).toBeDefined()
		expect(screen.getByText('TT-1')).toBeDefined()
		expect(screen.getByText('Проверить карточку задачи')).toBeDefined()
		expect(screen.getByText('К выполнению')).toBeDefined()
		expect(screen.getByText('Высокий')).toBeDefined()
		expect(screen.getByText('2026-05-01')).toBeDefined()
		expect(screen.getAllByText('Алексей Морозов')).toHaveLength(2)
		expect(screen.getByText('ui')).toBeDefined()
		expect(screen.getByText('Описание задачи для unit-теста board UI.')).toBeDefined()
		expect(screen.getByText('Первый комментарий')).toBeDefined()
		expect(screen.getByLabelText('Новый комментарий')).toHaveProperty(
			'value',
			'Черновик ответа',
		)
		expect(screen.getByRole('button', { name: 'Отправить комментарий' })).toHaveProperty(
			'disabled',
			true,
		)
	})

	it('вызывает изменение draft, submit и закрытие drawer', () => {
		let draftValue = ''
		let isOpen = true
		let submitCalls = 0

		renderDialog({
			onCommentDraftChange: (value) => {
				draftValue = value
			},
			onOpenChange: (open) => {
				isOpen = open
			},
			onSubmitComment: (event) => {
				event.preventDefault()
				submitCalls += 1
			},
		})

		const textarea = screen.getByLabelText('Новый комментарий')

		fireEvent.change(textarea, {
			target: { value: 'Новый комментарий' },
		})
		fireEvent.submit(textarea.closest('form')!)
		fireEvent.click(screen.getByTestId('mock-close-dialog'))

		expect(draftValue).toBe('Новый комментарий')
		expect(submitCalls).toBe(1)
		expect(isOpen).toBe(false)
	})

	it('вызывает редактирование и удаление выбранной задачи', () => {
		let editedTaskId = ''
		let deletedTaskId = ''

		renderDialog({
			onDeleteTask: (task) => {
				deletedTaskId = task.id
			},
			onEditTask: (task) => {
				editedTaskId = task.id
			},
		})

		fireEvent.click(screen.getByRole('button', { name: 'Редактировать' }))
		fireEvent.click(screen.getByRole('button', { name: 'Удалить задачу' }))

		expect(editedTaskId).toBe('task-a')
		expect(deletedTaskId).toBe('task-a')
	})

	it('копирует ключ задачи и показывает success toast', async () => {
		const writeTextMock = setClipboardWriteMock(() => Promise.resolve())
		const { successToast } = getBoardTaskDetailsDialogToastMocks()

		renderDialog()

		fireEvent.click(screen.getByRole('button', { name: 'Скопировать ключ задачи' }))

		await waitFor(() => {
			expect(writeTextMock).toHaveBeenCalledWith('TT-1')
		})
		expect(successToast).toHaveBeenCalledWith('Ключ TT-1 скопирован')
	})

	it('показывает error toast, если копирование ключа не удалось', async () => {
		const writeTextMock = setClipboardWriteMock(() =>
			Promise.reject(new Error('clipboard denied')),
		)
		const { errorToast } = getBoardTaskDetailsDialogToastMocks()

		renderDialog()

		fireEvent.click(screen.getByRole('button', { name: 'Скопировать ключ задачи' }))

		await waitFor(() => {
			expect(writeTextMock).toHaveBeenCalledWith('TT-1')
		})
		expect(errorToast).toHaveBeenCalledWith('Не удалось скопировать ключ задачи')
	})

	it('переключается на историю и показывает системного автора', () => {
		const task = createBoardTaskFixture({
			history: [
				{
					id: 'history-system',
					action: 'Статус изменён автоматически',
					actor: null,
					createdAtLabel: 'Сегодня, 12:00',
				},
			],
		})

		renderDialog({ task })

		fireEvent.click(screen.getByRole('button', { name: 'История (1)' }))

		expect(screen.getByText('Система')).toBeDefined()
		expect(screen.getByText('Статус изменён автоматически')).toBeDefined()
		expect(screen.queryByRole('button', { name: 'Отправить комментарий' })).toBeNull()
	})

	it('показывает пустые состояния комментариев и истории', () => {
		renderDialog({
			task: createBoardTaskFixture({
				comments: [],
				history: [],
			}),
		})

		expect(screen.getByText('Комментариев нет')).toBeDefined()

		fireEvent.click(screen.getByRole('button', { name: 'История (0)' }))

		expect(screen.getByText('История пока пуста')).toBeDefined()
	})
})
