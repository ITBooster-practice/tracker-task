import { createBoardColumnsFixture } from '@/test/mocks/views/boards/board-ui.fixtures'
import {
	getBoardUnitMockState,
	resetBoardUnitMocks,
} from '@/test/mocks/views/boards/board.mock'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { BoardTaskMoveInput } from '@/views/boards/model/types'
import { Board } from '@/views/boards/ui/board'

describe('Board', () => {
	beforeEach(() => {
		resetBoardUnitMocks()
	})

	afterEach(cleanup)

	it('рендерит колонки, sensors и прокидывает открытие задачи', () => {
		let openedTaskId = ''

		render(
			<Board
				columns={createBoardColumnsFixture()}
				onOpenTask={(taskId) => {
					openedTaskId = taskId
				}}
				onMoveTask={() => undefined}
			/>,
		)

		fireEvent.click(screen.getByText('Проверить карточку задачи'))

		const state = getBoardUnitMockState()
		const renderedColumns = state.boardColumnProps.slice(-2)

		expect(screen.getByTestId('dnd-context')).toBeDefined()
		expect(state.dndContextProps?.collisionDetection).toBe('closestCorners')
		expect(state.sensorCalls).toHaveLength(2)
		expect(state.sensorCalls[0]).toMatchObject({
			options: {
				activationConstraint: {
					distance: 8,
				},
			},
			sensor: 'PointerSensor',
		})
		expect(renderedColumns.map((props) => props.column.id)).toEqual(['TODO', 'DONE'])
		expect(renderedColumns.every((props) => props.disabled === false)).toBe(true)
		expect(openedTaskId).toBe('task-a')
	})

	it('не начинает drag interaction, когда доска disabled', () => {
		let moveInput: BoardTaskMoveInput | null = null

		render(
			<Board
				columns={createBoardColumnsFixture()}
				disableInteraction
				onOpenTask={() => undefined}
				onMoveTask={(input) => {
					moveInput = input
				}}
			/>,
		)

		fireEvent.click(screen.getByTestId('drag-start'))
		fireEvent.click(screen.getByTestId('drag-end-column'))

		const renderedColumns = getBoardUnitMockState().boardColumnProps.slice(-2)

		expect(moveInput).toBeNull()
		expect(renderedColumns.every((props) => props.disabled === true)).toBe(true)
		expect(screen.queryByTestId('overlay-card-task-a')).toBeNull()
	})

	it('переносит активную карточку в конец целевой колонки', () => {
		let moveInput: BoardTaskMoveInput | null = null

		render(
			<Board
				columns={createBoardColumnsFixture()}
				onOpenTask={() => undefined}
				onMoveTask={(input) => {
					moveInput = input
				}}
			/>,
		)

		fireEvent.click(screen.getByTestId('drag-start'))
		fireEvent.click(screen.getByTestId('drag-end-column'))

		expect(moveInput).toEqual({
			taskId: 'task-a',
			toColumnId: 'DONE',
			toIndex: 1,
		})
	})

	it('использует последний drag-over placement, если drop завершился вне цели', () => {
		let moveInput: BoardTaskMoveInput | null = null

		render(
			<Board
				columns={createBoardColumnsFixture()}
				onOpenTask={() => undefined}
				onMoveTask={(input) => {
					moveInput = input
				}}
			/>,
		)

		fireEvent.click(screen.getByTestId('drag-start'))

		expect(screen.getByTestId('overlay-card-task-a')).toBeDefined()

		fireEvent.click(screen.getByTestId('drag-over-column'))

		const renderedColumns = getBoardUnitMockState().boardColumnProps.slice(-2)
		const doneColumn = renderedColumns.find((props) => props.column.id === 'DONE')

		expect(doneColumn?.column.tasks.map((task) => task.id)).toContain('task-a')

		fireEvent.click(screen.getByTestId('drag-end-empty'))

		expect(moveInput).toEqual({
			taskId: 'task-a',
			toColumnId: 'DONE',
			toIndex: 1,
		})
	})

	it('считает позицию относительно задачи, когда pointer ниже карточки', () => {
		let moveInput: BoardTaskMoveInput | null = null

		render(
			<Board
				columns={createBoardColumnsFixture()}
				onOpenTask={() => undefined}
				onMoveTask={(input) => {
					moveInput = input
				}}
			/>,
		)

		fireEvent.click(screen.getByTestId('drag-start'))
		fireEvent.click(screen.getByTestId('drag-end-task'))

		expect(moveInput).toEqual({
			taskId: 'task-a',
			toColumnId: 'TODO',
			toIndex: 2,
		})
	})

	it('cancel сбрасывает drag state без move callback', () => {
		let moveCalls = 0

		render(
			<Board
				columns={createBoardColumnsFixture()}
				onOpenTask={() => undefined}
				onMoveTask={() => {
					moveCalls += 1
				}}
			/>,
		)

		fireEvent.click(screen.getByTestId('drag-start'))
		fireEvent.click(screen.getByTestId('drag-cancel'))

		expect(moveCalls).toBe(0)
		expect(screen.queryByTestId('overlay-card-task-a')).toBeNull()
	})
})
