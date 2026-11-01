import { createBoardColumnsFixture } from '@/test/mocks/views/boards/board-ui.fixtures'
import {
	getBoardUnitMockState,
	resetBoardUnitMocks,
} from '@/test/mocks/views/boards/board.mock'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
	boardCellId,
	buildBoardLanes,
	moveTaskInLane,
} from '@/views/boards/model/board-swimlanes'
import type { BoardTaskMoveInput } from '@/views/boards/model/types'
import { moveTaskInColumns } from '@/views/boards/model/utils'
import { Board } from '@/views/boards/ui/board'

describe('Board', () => {
	beforeEach(() => {
		resetBoardUnitMocks()
	})

	afterEach(cleanup)

	it('оставляет заголовки и общее сообщение, когда задачи доски не попали в выборку', () => {
		const columns = createBoardColumnsFixture().map((column) => ({
			...column,
			tasks: [],
		}))
		render(
			<Board
				columns={columns}
				onOpenTask={vi.fn()}
				grouping='assignee'
				lanes={buildBoardLanes('assignee', columns, [])}
				emptyState={<h2>Нет задач с такими фильтрами</h2>}
			/>,
		)
		expect(
			screen.getByRole('heading', { name: 'Нет задач с такими фильтрами' }),
		).toBeDefined()
		expect(
			getBoardUnitMockState()
				.boardColumnProps.slice(-columns.length)
				.map((props) => ({ id: props.column.id, headerOnly: props.headerOnly })),
		).toEqual(columns.map((column) => ({ id: column.id, headerOnly: true })))
	})

	it.each([false, true])(
		'keeps the drop position until the cache takes over, including rollback (%s)',
		async (fail) => {
			const columns = createBoardColumnsFixture()
			let resolve!: () => void
			let reject!: (error: unknown) => void
			const pending = new Promise<void>((yes, no) => {
				resolve = yes
				reject = no
			})
			const move = vi
				.fn<(input: BoardTaskMoveInput) => Promise<void>>()
				.mockReturnValue(pending)
			const props = { onOpenTask: () => undefined, onMoveTask: move }
			const { rerender } = render(<Board {...props} columns={columns} />)
			const location = () =>
				getBoardUnitMockState()
					.boardColumnProps.slice(-2)
					.find((item) => item.column.tasks.some((task) => task.id === 'task-a'))!.column
			fireEvent.click(screen.getByTestId('drag-start'))
			fireEvent.click(screen.getByTestId('drag-over-column'))
			expect(location().id).toBe('DONE')
			fireEvent.click(screen.getByTestId('drag-end-column'))
			expect(location().id).toBe('DONE')
			expect(screen.queryByTestId('overlay-card-task-a')).toBeNull()
			rerender(<Board {...props} columns={columns} disableInteraction />)
			expect(location().id).toBe('DONE')
			const refreshed = columns.map((column) => ({
				...column,
				tasks: column.tasks.map((task) =>
					task.id === 'task-a' ? { ...task, title: 'Refreshed task metadata' } : task,
				),
			}))
			rerender(<Board {...props} columns={refreshed} disableInteraction />)
			expect(location().id).toBe('DONE')
			expect(location().tasks.find((task) => task.id === 'task-a')!.title).toBe(
				'Refreshed task metadata',
			)
			const accepted = moveTaskInColumns(columns, move.mock.calls[0]![0])
			accepted[1]!.tasks.find((task) => task.id === 'task-a')!.title =
				'Authoritative task'
			rerender(<Board {...props} columns={accepted} disableInteraction />)
			expect(location().tasks.find((task) => task.id === 'task-a')!.title).toBe(
				'Authoritative task',
			)
			if (fail) {
				rerender(<Board {...props} columns={columns} disableInteraction />)
				expect(location().id).toBe('TODO')
				await act(async () => reject(new Error('Move failed')))
			} else await act(async () => resolve())
			await waitFor(() => expect(location().id).toBe(fail ? 'TODO' : 'DONE'))
		},
	)

	it('rolls back a rejected drop even if no optimistic props arrived', async () => {
		const columns = createBoardColumnsFixture()
		let reject!: (error: unknown) => void
		const move = vi.fn().mockReturnValue(
			new Promise<void>((_, no) => {
				reject = no
			}),
		)
		render(<Board columns={columns} onOpenTask={() => undefined} onMoveTask={move} />)
		fireEvent.click(screen.getByTestId('drag-start'))
		fireEvent.click(screen.getByTestId('drag-end-column'))
		expect(
			getBoardUnitMockState()
				.boardColumnProps.slice(-2)[1]!
				.column.tasks.map((task) => task.id),
		).toContain('task-a')
		await act(async () => reject(new Error('Move failed')))
		await waitFor(() =>
			expect(
				getBoardUnitMockState()
					.boardColumnProps.slice(-2)[0]!
					.column.tasks.map((task) => task.id),
			).toContain('task-a'),
		)
	})

	it('keeps grouped drop metadata during handoff and discards it when filters change', async () => {
		const columns = createBoardColumnsFixture()
		const lanes = buildBoardLanes('priority', columns, [])
		const low = lanes.find((lane) => lane.priority === 'LOW')!
		let resolve!: () => void
		const move = vi.fn().mockReturnValue(
			new Promise<void>((yes) => {
				resolve = yes
			}),
		)
		const props = {
			grouping: 'priority' as const,
			lanes,
			columns,
			onOpenTask: () => undefined,
			onMoveTask: move,
		}
		const { rerender } = render(<Board {...props} dragScope='all' />)
		act(() =>
			getBoardUnitMockState().dndContextProps!.onDragStart({ active: { id: 'task-a' } }),
		)
		const event = {
			active: { id: 'task-a', rect: { current: { translated: null } } },
			over: { id: boardCellId(low, 'DONE'), rect: { top: 0, height: 100 } },
		}
		act(() => getBoardUnitMockState().dndContextProps!.onDragOver(event))
		act(() => getBoardUnitMockState().dndContextProps!.onDragEnd(event))
		const expected = moveTaskInLane(columns, move.mock.calls[0]![0], low)
		expect(
			getBoardUnitMockState()
				.boardColumnProps.slice(-2)
				.map((item) => item.column),
		).toEqual(expected)
		rerender(<Board {...props} dragScope='HIGH' />)
		expect(
			getBoardUnitMockState()
				.boardColumnProps.slice(-2)
				.map((item) => item.column),
		).toEqual(columns)
		await act(async () => resolve())
		expect(
			getBoardUnitMockState()
				.boardColumnProps.slice(-2)
				.map((item) => item.column),
		).toEqual(columns)
	})

	it.each([false, true])(
		'перенос в другую группу задаёт метаданные, drop снаружи не сохраняет (%s)',
		(outside) => {
			const columns = createBoardColumnsFixture(),
				lanes = buildBoardLanes('priority', columns, []),
				move = vi.fn()
			const low = lanes.find((lane) => lane.priority === 'LOW')!
			render(
				<Board
					columns={columns}
					grouping='priority'
					lanes={lanes}
					onOpenTask={() => undefined}
					onMoveTask={move}
				/>,
			)
			act(() =>
				getBoardUnitMockState().dndContextProps!.onDragStart({
					active: { id: 'task-a' },
				}),
			)
			const event = {
				active: { id: 'task-a', rect: { current: { translated: null } } },
				over: { id: boardCellId(low, 'DONE'), rect: { top: 0, height: 100 } },
			}
			act(() => getBoardUnitMockState().dndContextProps!.onDragOver(event))
			act(() =>
				getBoardUnitMockState().dndContextProps!.onDragEnd({
					...event,
					over: outside ? null : event.over,
				}),
			)
			if (outside) expect(move).not.toHaveBeenCalled()
			else
				expect(move).toHaveBeenCalledExactlyOnceWith({
					taskId: 'task-a',
					toColumnId: 'DONE',
					toIndex: 0,
					priority: 'LOW',
				})
		},
	)

	it('смена фильтров отменяет начатое перетаскивание без запроса переноса', () => {
		const move = vi.fn()
		const columns = createBoardColumnsFixture()
		const { rerender } = render(
			<Board
				columns={columns}
				onOpenTask={() => undefined}
				onMoveTask={move}
				dragScope='all'
			/>,
		)
		fireEvent.click(screen.getByTestId('drag-start'))
		expect(screen.getByTestId('overlay-card-task-a')).toBeDefined()
		rerender(
			<Board
				columns={columns}
				onOpenTask={() => undefined}
				onMoveTask={move}
				dragScope='HIGH'
			/>,
		)
		fireEvent.click(screen.getByTestId('drag-end-column'))
		expect(move).not.toHaveBeenCalled()
		expect(screen.queryByTestId('overlay-card-task-a')).toBeNull()
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
		expect(state.sensorCalls).toHaveLength(3)
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

	it.each([
		[false, 330, 2],
		[false, 380, 3],
		[true, 330, 2],
		[true, 380, 3],
	] as const)(
		'places a tall card before or after the final task using its center (grouped=%s, top=%i)',
		(grouped, top, expectedIndex) => {
			const columns = createBoardColumnsFixture()
			columns[0]!.tasks.push(
				{ ...columns[0]!.tasks[1]!, id: 'task-c', title: 'Third task' },
				{ ...columns[0]!.tasks[1]!, id: 'task-d', title: 'Last task' },
			)
			const move = vi.fn()
			render(
				<Board
					columns={columns}
					onOpenTask={() => undefined}
					onMoveTask={move}
					grouping={grouped ? 'priority' : 'none'}
					lanes={grouped ? buildBoardLanes('priority', columns, []) : []}
				/>,
			)
			fireEvent.click(screen.getByTestId('drag-start'))
			const event = {
				active: { id: 'task-a', rect: { current: { translated: { top, height: 160 } } } },
				over: { id: 'task-d', rect: { top: 400, height: 80 } },
			}
			act(() =>
				getBoardUnitMockState().dndContextProps!.onDragOver({
					...event,
					active: {
						...event.active,
						rect: { current: { translated: { top: 330, height: 160 } } },
					},
				}),
			)
			act(() => getBoardUnitMockState().dndContextProps!.onDragMove(event))
			const preview = getBoardUnitMockState().boardColumnProps.slice(-2)[0]!.column
			expect(preview.tasks.findIndex((task) => task.id === 'task-a')).toBe(expectedIndex)
			act(() => getBoardUnitMockState().dndContextProps!.onDragEnd(event))
			expect(move).toHaveBeenCalledWith(
				expect.objectContaining({
					taskId: 'task-a',
					toColumnId: 'TODO',
					toIndex: expectedIndex,
				}),
			)
		},
	)

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
