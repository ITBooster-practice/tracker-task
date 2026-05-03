import {
	getBoardColumnMockState,
	resetBoardColumnUnitMocks,
	setBoardColumnIsOver,
} from '@/test/mocks/views/boards/board-column.mock'
import {
	createBoardColumnFixture,
	createBoardTaskFixture,
} from '@/test/mocks/views/boards/board-ui.fixtures'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { BoardColumn } from '@/views/boards/ui/board-column'

describe('BoardColumn', () => {
	beforeEach(() => {
		resetBoardColumnUnitMocks()
	})

	afterEach(cleanup)

	it('рендерит заголовок, счётчик и карточки колонки', () => {
		let openedTaskId = ''
		const column = createBoardColumnFixture()

		render(
			<BoardColumn
				column={column}
				activeDragTaskId='task-b'
				onOpenTask={(taskId) => {
					openedTaskId = taskId
				}}
			/>,
		)

		fireEvent.click(screen.getByTestId('column-card-task-a'))

		const state = getBoardColumnMockState()
		const activeCardProps = state.boardCardProps.find(
			(props) => props.task.id === 'task-b',
		)

		expect(screen.getByText('К выполнению')).toBeDefined()
		expect(screen.getByText('2')).toBeDefined()
		expect(screen.getByTestId('sortable-context').getAttribute('data-items')).toBe(
			'task-a,task-b',
		)
		expect(openedTaskId).toBe('task-a')
		expect(state.droppableCalls.at(-1)).toMatchObject({
			data: {
				columnId: 'TODO',
				type: 'column',
			},
			disabled: false,
			id: 'board-column:TODO',
		})
		expect(activeCardProps?.isActiveDragItem).toBe(true)
		expect(activeCardProps?.disabled).toBe(false)
	})

	it('показывает drop-подсказку для пустой активной колонки', () => {
		const column = createBoardColumnFixture({
			tasks: [],
		})

		render(
			<BoardColumn
				column={column}
				activeDragTaskId={null}
				onOpenTask={() => undefined}
			/>,
		)

		expect(screen.getByText('Перетащите карточку сюда')).toBeDefined()
		expect(screen.getByTestId('sortable-context').getAttribute('data-items')).toBe('')
	})

	it('при disabled показывает фильтр-empty state и передаёт disabled в droppable/cards', () => {
		setBoardColumnIsOver(true)
		const column = createBoardColumnFixture({
			tasks: [createBoardTaskFixture()],
		})
		render(
			<BoardColumn
				column={column}
				activeDragTaskId={null}
				disabled
				onOpenTask={() => undefined}
			/>,
		)

		const state = getBoardColumnMockState()

		expect(screen.getByTestId('sortable-context').parentElement?.className).toContain(
			'bg-primary/5',
		)
		expect(screen.getByTestId('column-card-task-a').getAttribute('data-disabled')).toBe(
			'true',
		)
		expect(state.droppableCalls.at(-1)?.disabled).toBe(true)
		expect(state.boardCardProps.at(-1)?.disabled).toBe(true)
	})

	it('для пустой disabled колонки показывает сообщение текущих фильтров', () => {
		render(
			<BoardColumn
				column={createBoardColumnFixture({ tasks: [] })}
				activeDragTaskId={null}
				disabled
				onOpenTask={() => undefined}
			/>,
		)

		expect(screen.getByText('Нет задач под текущие фильтры')).toBeDefined()
	})
})
