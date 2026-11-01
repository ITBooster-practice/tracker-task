import {
	getBoardCardDragListeners,
	getBoardCardSortableCalls,
	resetBoardCardUnitMocks,
	setBoardCardIsDragging,
} from '@/test/mocks/views/boards/board-card.mock'
import { createBoardTaskFixture as createTaskFixture } from '@/test/mocks/views/boards/board-ui.fixtures'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { BoardCard } from '@/views/boards/ui/board-card'

describe('BoardCard', () => {
	beforeEach(() => {
		resetBoardCardUnitMocks()
	})

	afterEach(cleanup)

	it('рендерит карточку без исполнителя', () => {
		render(
			<BoardCard
				task={createTaskFixture({ assignee: null, assigneeId: null })}
				boardColumnId='custom-column'
				onOpenTask={() => undefined}
			/>,
		)
		expect(screen.getByText('—')).toBeDefined()
	})

	it('рендерит данные задачи и регистрирует sortable с колонкой', () => {
		let openedTaskId = ''
		const task = createTaskFixture({ labels: ['refactor', 'Frontend'] })

		render(
			<BoardCard
				task={task}
				boardColumnId='TODO'
				onOpenTask={(taskId) => {
					openedTaskId = taskId
				}}
			/>,
		)

		fireEvent.click(screen.getByTestId('board-task-task-a'))

		expect(screen.getByText('TT-1')).toBeDefined()
		expect(screen.getByText('Проверить карточку задачи')).toBeDefined()
		expect(screen.getByText('refactor')).toBeDefined()
		expect(screen.getByText('Frontend')).toBeDefined()
		expect(screen.getByText(/просрочено/)).toBeDefined()
		expect(openedTaskId).toBe('task-a')
		expect(getBoardCardSortableCalls().at(-1)).toMatchObject({
			data: {
				boardColumnId: 'TODO',
				taskId: 'task-a',
				type: 'task',
			},
			disabled: false,
			id: 'task-a',
		})
	})

	it('открывает задачу по Enter и начинает перенос по Пробелу на самой карточке', () => {
		const openedTaskIds: string[] = []
		const task = createTaskFixture()

		render(
			<BoardCard
				task={task}
				boardColumnId='TODO'
				onOpenTask={(taskId) => {
					openedTaskIds.push(taskId)
				}}
			/>,
		)

		const card = screen.getByTestId('board-task-task-a')
		fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' })
		fireEvent.keyDown(card, { key: ' ', code: 'Space' })

		expect(openedTaskIds).toEqual(['task-a'])
		expect(getBoardCardDragListeners().onKeyDown).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ code: 'Space' }),
		)
		expect(card.getAttribute('aria-describedby')).toBeTruthy()
	})

	it('начинает перенос за название и нижнюю часть карточки', () => {
		let opened = 0
		render(
			<BoardCard
				task={createTaskFixture({ assignee: null, assigneeId: null })}
				boardColumnId='TODO'
				laneKey='priority-high'
				onOpenTask={() => {
					opened++
				}}
			/>,
		)
		fireEvent.pointerDown(screen.getByText('Проверить карточку задачи'))
		fireEvent.touchStart(screen.getByText('Без исполнителя'))
		expect(getBoardCardDragListeners().onPointerDown).toHaveBeenCalledOnce()
		expect(getBoardCardDragListeners().onTouchStart).toHaveBeenCalledOnce()
		expect(opened).toBe(0)
	})

	it('оставляет открытие с клавиатуры доступным при заблокированном переносе', () => {
		const openedTaskIds: string[] = []
		render(
			<BoardCard
				task={createTaskFixture()}
				boardColumnId='TODO'
				disabled
				onOpenTask={(taskId) => openedTaskIds.push(taskId)}
			/>,
		)
		const card = screen.getByTestId('board-task-task-a')
		fireEvent.pointerDown(card)
		fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' })
		fireEvent.keyDown(card, { key: ' ', code: 'Space' })
		expect(openedTaskIds).toEqual(['task-a', 'task-a'])
		expect(getBoardCardDragListeners().onKeyDown).not.toHaveBeenCalled()
		expect(getBoardCardDragListeners().onPointerDown).not.toHaveBeenCalled()
	})

	it('не открывает задачу при завершении переноса с клавиатуры', () => {
		setBoardCardIsDragging(true)
		let opened = 0
		render(
			<BoardCard
				task={createTaskFixture()}
				boardColumnId='TODO'
				onOpenTask={() => opened++}
			/>,
		)
		const card = screen.getByTestId('board-task-task-a')
		fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' })
		expect(opened).toBe(0)
		expect(getBoardCardDragListeners().onKeyDown).not.toHaveBeenCalled()
	})

	it('передаёт disabled в sortable и показывает dragging class', () => {
		setBoardCardIsDragging(true)

		render(
			<BoardCard
				task={createTaskFixture()}
				boardColumnId='TODO'
				disabled
				onOpenTask={() => undefined}
			/>,
		)

		const card = screen.getByTestId('board-task-task-a')

		expect(card.className).toContain('cursor-default')
		expect(card.className).toContain('opacity-85')
		expect(getBoardCardSortableCalls().at(-1)?.disabled).toBe(true)
	})

	it('для active drag item рендерит placeholder без открытия по клику', () => {
		let openCalls = 0

		render(
			<BoardCard
				task={createTaskFixture()}
				boardColumnId='TODO'
				isActiveDragItem
				onOpenTask={() => {
					openCalls += 1
				}}
			/>,
		)

		fireEvent.click(screen.getByTestId('board-task-task-a'))

		expect(screen.getByText('Проверить карточку задачи')).toBeDefined()
		expect(openCalls).toBe(0)
	})

	it('renders the drag overlay without registering a duplicate sortable task', () => {
		render(
			<BoardCard
				task={createTaskFixture({ id: 'task-overlay' })}
				boardColumnId='IN_PROGRESS'
				isDragOverlay
				onOpenTask={() => undefined}
			/>,
		)

		const card = screen.getByTestId('board-task-overlay-task-overlay')

		expect(card.getAttribute('style')).toBeNull()
		expect(getBoardCardSortableCalls()).toHaveLength(0)
		expect(card.getAttribute('role')).toBeNull()
	})
})
