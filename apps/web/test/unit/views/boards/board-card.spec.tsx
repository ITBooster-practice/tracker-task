import {
	getBoardCardDragListeners,
	getBoardCardSortableCalls,
	resetBoardCardUnitMocks,
	setBoardCardIsDragging,
} from '@/test/mocks/views/boards/board-card.mock'
import { createBoardTaskFixture as createTaskFixture } from '@/test/mocks/views/boards/board-ui.fixtures'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BoardCard, PendingBoardCard } from '@/views/boards/ui/board-card'
import { syncServerClock } from '@/shared/lib/server-clock'

describe('BoardCard', () => {
	beforeEach(() => {
		resetBoardCardUnitMocks()
		vi.stubGlobal(
			'ResizeObserver',
			class {
				observe() {}
				unobserve() {}
				disconnect() {}
			},
		)
		vi.useFakeTimers({ toFake: ['Date', 'performance', 'setInterval', 'clearInterval'] })
		vi.setSystemTime(new Date('2099-01-01T00:00:00.000Z'))
		syncServerClock('Mon, 02 Nov 2026 12:00:00 GMT')
	})
	it('shows the shared tooltip on hover with the instruction and full assignee name', async () => {
		const name = 'Дмитрий Колотуша'
		render(
			<BoardCard
				task={createTaskFixture({ assignee: { id: 'user', name, initials: 'ДК' } })}
				boardColumnId='TODO'
				onOpenTask={() => undefined}
			/>,
		)
		fireEvent.pointerMove(screen.getByTestId('board-task-task-a'), {
			pointerType: 'mouse',
		})
		const tooltip = await screen.findByRole('tooltip')
		expect(tooltip.textContent).toContain('Зажмите и потяните')
		expect(tooltip.textContent).toContain(name)
	})

	afterEach(() => {
		cleanup()
		vi.useRealTimers()
		vi.unstubAllGlobals()
	})

	it('shows a saving preview without registering it for drag or keyboard opening', () => {
		const {
			title,
			type,
			priority,
			labels,
			dueDate,
			assignee,
			assigneeId,
			boardColumnId,
		} = createTaskFixture()
		render(
			<PendingBoardCard
				task={{
					localId: 'local-1',
					key: 'Локальная задача',
					title,
					type,
					priority,
					labels,
					dueDate,
					assignee,
					assigneeId,
					boardColumnId,
				}}
			/>,
		)
		const preview = screen.getByTestId('board-pending-task-local-1')
		expect(screen.getByText('Локальная задача')).toBeDefined()
		expect(screen.getByRole('status').textContent).toBe('Сохраняется…')
		expect(preview.querySelector('[data-slot="card"]')?.className).toContain(
			'border-dashed border-primary bg-primary/5',
		)
		expect(preview.getAttribute('role')).toBeNull()
		expect(preview.getAttribute('tabindex')).toBeNull()
		expect(getBoardCardSortableCalls()).toHaveLength(0)
		fireEvent.click(preview)
		fireEvent.keyDown(preview, { key: 'Enter' })
		expect(getBoardCardDragListeners().onKeyDown).not.toHaveBeenCalled()
	})

	it('marks the deadline red when server time passes it without reloading the task', () => {
		render(
			<BoardCard
				task={createTaskFixture({ dueDate: '2026-11-02T12:00:01.000Z', status: 'TODO' })}
				boardColumnId='TODO'
				onOpenTask={() => undefined}
			/>,
		)
		const deadline = document.querySelector('time')!
		expect(deadline.textContent).not.toContain('просрочено')
		act(() => vi.advanceTimersByTime(2000))
		expect(deadline.textContent).toContain('просрочено')
		expect(deadline.parentElement?.className).toContain('bg-destructive/10')
		expect(deadline.parentElement?.className).toContain('text-destructive')
	})

	it('highlights an expired deadline in Done and keeps the undated label', () => {
		const { rerender } = render(
			<BoardCard
				task={createTaskFixture({ dueDate: '2026-10-26T00:00:00.000Z', status: 'DONE' })}
				boardColumnId='DONE'
				onOpenTask={() => undefined}
			/>,
		)
		expect(screen.getByText(/просрочено/)).toBeDefined()
		expect(document.querySelector('time')?.parentElement?.className).toContain(
			'bg-destructive/10',
		)
		rerender(
			<BoardCard
				task={createTaskFixture({ dueDate: null, status: 'TODO' })}
				boardColumnId='TODO'
				onOpenTask={() => undefined}
			/>,
		)
		expect(screen.getByText('Без срока')).toBeDefined()
	})

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
