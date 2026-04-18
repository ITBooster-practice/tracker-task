import {
	getBoardMockState,
	getBoardTaskDetailsDialogMockState,
	getBoardTaskFormDialogMockState,
	resetBoardsPageViewUnitMocks,
} from '@/test/mocks/views/boards/boards-page-view.unit.mock'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useBoardStore } from '@/views/boards/model/store'
import { BoardsPageView } from '@/views/boards/ui/boards-page-view'

describe('BoardsPageView', () => {
	beforeEach(() => {
		useBoardStore.getState().resetBoard()
		resetBoardsPageViewUnitMocks()
	})

	afterEach(cleanup)

	it('по умолчанию рендерит доску и не отключает drag & drop', () => {
		render(<BoardsPageView />)

		expect(screen.getByTestId('board')).toBeDefined()
		expect(screen.getByTestId('board').getAttribute('data-disabled')).toBe('false')
		expect(getBoardMockState().callCount).toBeGreaterThan(0)
	})

	it('при активном фильтре передаёт в board disableInteraction=true', () => {
		useBoardStore.setState({ query: 'review' })

		render(<BoardsPageView />)

		expect(screen.getByTestId('board-toolbar').textContent).toBe('review:true')
		expect(screen.getByTestId('board').getAttribute('data-disabled')).toBe('true')
	})

	it('при пустом результате показывает empty state вместо доски', () => {
		useBoardStore.setState({ query: 'совпадений-нет' })

		render(<BoardsPageView />)

		expect(screen.getByTestId('empty-state')).toBeDefined()
		expect(screen.queryByTestId('board')).toBeNull()
		expect(screen.getByText('По этим фильтрам ничего не нашлось')).toBeDefined()
	})

	it('передаёт выбранную задачу в details dialog', () => {
		useBoardStore.setState({ openedTaskId: 'task-106' })

		render(<BoardsPageView />)

		expect(screen.getByTestId('task-dialog').textContent).toBe('task-106')
		expect(getBoardTaskDetailsDialogMockState().callCount).toBeGreaterThan(0)
	})

	it('открывает форму создания задачи и добавляет карточку на доску', () => {
		render(<BoardsPageView />)

		fireEvent.click(screen.getByRole('button', { name: 'Создать задачу' }))
		expect(screen.getByTestId('task-form-create')).toBeDefined()

		fireEvent.click(screen.getByRole('button', { name: 'submit create' }))

		const createdTask = useBoardStore
			.getState()
			.columns.flatMap((column) => column.tasks)
			.find((task) => task.title === 'Новая задача')

		expect(getBoardTaskFormDialogMockState().lastProps?.mode).toBe('create')
		expect(createdTask?.columnId).toBe('TODO')
	})
})
