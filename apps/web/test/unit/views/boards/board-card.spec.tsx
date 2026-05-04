import {
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

	it('рендерит данные задачи и регистрирует sortable с колонкой', () => {
		let openedTaskId = ''
		const task = createTaskFixture()

		render(
			<BoardCard
				task={task}
				columnId='TODO'
				onOpenTask={(taskId) => {
					openedTaskId = taskId
				}}
			/>,
		)

		fireEvent.click(screen.getByTestId('board-task-task-a'))

		expect(screen.getByText('TT-1')).toBeDefined()
		expect(screen.getByText('Проверить карточку задачи')).toBeDefined()
		expect(screen.getByText('1/3')).toBeDefined()
		expect(openedTaskId).toBe('task-a')
		expect(getBoardCardSortableCalls().at(-1)).toMatchObject({
			data: {
				columnId: 'TODO',
				taskId: 'task-a',
				type: 'task',
			},
			disabled: false,
			id: 'task-a',
		})
	})

	it('открывает задачу с клавиатуры', () => {
		const openedTaskIds: string[] = []
		const task = createTaskFixture()

		render(
			<BoardCard
				task={task}
				columnId='TODO'
				onOpenTask={(taskId) => {
					openedTaskIds.push(taskId)
				}}
			/>,
		)

		const card = screen.getByTestId('board-task-task-a')
		fireEvent.keyDown(card, { key: 'Enter' })
		fireEvent.keyDown(card, { key: ' ' })

		expect(openedTaskIds).toEqual(['task-a', 'task-a'])
	})

	it('передаёт disabled в sortable и показывает dragging class', () => {
		setBoardCardIsDragging(true)

		render(
			<BoardCard
				task={createTaskFixture()}
				columnId='TODO'
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
				columnId='TODO'
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

	it('drag overlay отключает sortable и не выставляет transform style', () => {
		render(
			<BoardCard
				task={createTaskFixture({ id: 'task-overlay' })}
				columnId='IN_PROGRESS'
				isDragOverlay
				onOpenTask={() => undefined}
			/>,
		)

		const card = screen.getByTestId('board-task-task-overlay')

		expect(card.getAttribute('style')).toBeNull()
		expect(getBoardCardSortableCalls().at(-1)).toMatchObject({
			disabled: true,
			id: 'task-overlay',
		})
	})
})
