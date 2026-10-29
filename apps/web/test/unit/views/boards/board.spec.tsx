import { createBoardColumnsFixture } from '@/test/mocks/views/boards/board-ui.fixtures'
import {
	getBoardUnitMockState,
	resetBoardUnitMocks,
} from '@/test/mocks/views/boards/board.mock'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { BoardTaskMoveInput } from '@/views/boards/model/types'
import { Board } from '@/views/boards/ui/board'

describe('Board', () => {
	beforeEach(() => {
		resetBoardUnitMocks()
	})

	afterEach(cleanup)

	it('создаёт колонку inline, сохраняет черновик после ошибки и возвращает фокус', async () => {
		const create = vi
			.fn<(title: string) => Promise<void>>()
			.mockRejectedValueOnce({ statusCode: 409, message: 'Conflict' })
			.mockResolvedValueOnce(undefined)
		render(
			<Board
				columns={createBoardColumnsFixture()}
				onOpenTask={() => undefined}
				onMoveTask={() => undefined}
				onCreateColumn={create}
			/>,
		)
		fireEvent.click(screen.getByRole('button', { name: 'Добавить колонку' }))
		const input = screen.getByLabelText('Название новой колонки')
		expect(document.activeElement).toBe(input)
		expect(
			getBoardUnitMockState()
				.boardColumnProps.slice(-2)
				.every((props) => props.disabled),
		).toBe(true)
		fireEvent.click(screen.getByTestId('drag-start'))
		expect(screen.queryByTestId('overlay-card-task-a')).toBeNull()
		fireEvent.change(input, { target: { value: '  Проверка  ' } })
		fireEvent.submit(input.closest('form')!)
		await screen.findByRole('alert')
		expect(input).toHaveProperty('value', '  Проверка  ')
		fireEvent.submit(input.closest('form')!)
		await waitFor(() =>
			expect(screen.queryByLabelText('Название новой колонки')).toBeNull(),
		)
		expect(create).toHaveBeenLastCalledWith('Проверка')
		await waitFor(() =>
			expect(document.activeElement).toBe(
				screen.getByRole('button', { name: 'Добавить колонку' }),
			),
		)
		expect(
			getBoardUnitMockState()
				.boardColumnProps.slice(-2)
				.every((props) => !props.disabled),
		).toBe(true)
	})

	it('переименовывает выбранную колонку и отменяет создание по Escape', async () => {
		const rename = vi
			.fn<(id: string, title: string) => Promise<void>>()
			.mockResolvedValue(undefined)
		const create = vi.fn<(title: string) => Promise<void>>()
		render(
			<Board
				columns={createBoardColumnsFixture()}
				onOpenTask={() => undefined}
				onCreateColumn={create}
				onRenameColumn={rename}
			/>,
		)
		fireEvent.click(
			screen.getByRole('button', { name: 'Переименовать колонку «К выполнению»' }),
		)
		const input = screen.getByLabelText('Название колонки')
		fireEvent.change(input, { target: { value: 'Новый этап' } })
		fireEvent.submit(input.closest('form')!)
		await waitFor(() =>
			expect(rename).toHaveBeenCalledExactlyOnceWith('TODO', 'Новый этап'),
		)
		await waitFor(() => expect(screen.queryByLabelText('Название колонки')).toBeNull())
		fireEvent.click(screen.getByRole('button', { name: 'Добавить колонку' }))
		fireEvent.keyDown(screen.getByLabelText('Название новой колонки'), { key: 'Escape' })
		expect(screen.queryByLabelText('Название новой колонки')).toBeNull()
		expect(create).not.toHaveBeenCalled()
		expect(document.activeElement).toBe(
			screen.getByRole('button', { name: 'Добавить колонку' }),
		)
	})

	it('оставляет открытие карточек, отключая drag без обработчика переноса', () => {
		let openedTaskId = ''
		render(
			<Board
				columns={createBoardColumnsFixture()}
				onOpenTask={(taskId) => {
					openedTaskId = taskId
				}}
			/>,
		)
		const columns = getBoardUnitMockState().boardColumnProps.slice(-2)
		expect(columns.every((props) => props.disabled === true)).toBe(true)
		fireEvent.click(screen.getByText('Проверить карточку задачи'))
		expect(openedTaskId).toBe('task-a')
		fireEvent.click(screen.getByTestId('drag-start'))
		expect(screen.queryByTestId('overlay-card-task-a')).toBeNull()
	})

	it('сохраняет произвольный ID колонки целиком при drop', () => {
		const columns = createBoardColumnsFixture()
		columns[1]!.id = 'column:custom-target'
		let moveInput: BoardTaskMoveInput | undefined
		render(
			<Board
				columns={columns}
				onOpenTask={() => undefined}
				onMoveTask={(input) => {
					moveInput = input
				}}
			/>,
		)
		fireEvent.click(screen.getByTestId('drag-start'))
		act(() =>
			getBoardUnitMockState().dndContextProps!.onDragEnd({
				active: { id: 'task-a', rect: { current: { translated: null } } },
				over: { id: 'board-column:column:custom-target', rect: { top: 0, height: 100 } },
			}),
		)
		expect(moveInput).toEqual({
			taskId: 'task-a',
			toColumnId: 'column:custom-target',
			toIndex: 1,
		})
	})

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
			toIndex: 1,
		})
	})

	it.each([false, true])(
		'drop в ту же колонку задаёт индекс после удаления карточки (preview=%s)',
		(preview) => {
			let moveInput: BoardTaskMoveInput | undefined
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
			const event = {
				active: { id: 'task-a', rect: { current: { translated: null } } },
				over: { id: 'board-column:TODO', rect: { top: 0, height: 100 } },
			}
			if (preview) act(() => getBoardUnitMockState().dndContextProps!.onDragOver(event))
			act(() => getBoardUnitMockState().dndContextProps!.onDragEnd(event))
			expect(moveInput).toEqual({ taskId: 'task-a', toColumnId: 'TODO', toIndex: 1 })
		},
	)

	it('повторный drop в целевую колонку после preview не считает активную карточку второй раз', () => {
		let moveInput: BoardTaskMoveInput | undefined
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
		fireEvent.click(screen.getByTestId('drag-over-column'))
		fireEvent.click(screen.getByTestId('drag-end-column'))
		expect(moveInput).toEqual({ taskId: 'task-a', toColumnId: 'DONE', toIndex: 1 })
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
