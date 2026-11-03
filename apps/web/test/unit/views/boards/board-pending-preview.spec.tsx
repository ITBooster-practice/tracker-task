import {
	createBoardColumnFixture,
	createBoardTaskFixture,
} from '@/test/mocks/views/boards/board-ui.fixtures'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { buildBoardLanes } from '@/views/boards/model/board-swimlanes'
import type { PendingBoardTask } from '@/views/boards/model/types'
import { Board } from '@/views/boards/ui/board'
import { BoardColumn } from '@/views/boards/ui/board-column'

const sortableCalls = vi.hoisted(() => [] as string[])

vi.mock('@dnd-kit/sortable', async (importOriginal) => ({
	...(await importOriginal<typeof import('@dnd-kit/sortable')>()),
	useSortable: ({ id }: { id: string }) => {
		sortableCalls.push(id)
		return {
			attributes: {},
			listeners: {},
			setNodeRef: () => undefined,
			transform: null,
			transition: undefined,
			isDragging: false,
		}
	},
	SortableContext: ({
		children,
		items,
	}: React.PropsWithChildren<{ items: string[] }>) => (
		<div data-testid='pending-sortable-context' data-items={items.join(',')}>
			{children}
		</div>
	),
}))

function createPendingTask(overrides: Partial<PendingBoardTask> = {}): PendingBoardTask {
	return {
		localId: 'local-1',
		boardColumnId: 'TODO',
		key: 'Локальная задача',
		title: 'Новая задача',
		type: 'TASK',
		priority: 'HIGH',
		labels: ['UI'],
		dueDate: null,
		assigneeId: null,
		assignee: null,
		...overrides,
	}
}

describe('pending board presentation', () => {
	beforeEach(() => {
		sortableCalls.length = 0
	})
	afterEach(cleanup)

	it('shows the additional count and places pending before sortable real tasks without opening it', () => {
		const onOpenTask = vi.fn()
		const column = createBoardColumnFixture()
		const pending = createPendingTask()
		const { rerender } = render(
			<BoardColumn
				column={column}
				pendingTasks={[pending]}
				onOpenTask={onOpenTask}
				activeDragTaskId={null}
			/>,
		)
		const preview = screen.getByTestId('board-pending-task-local-1')
		expect(
			within(
				screen.getByRole('heading', { name: column.title }).parentElement!,
			).getByText('+ 1'),
		).toBeDefined()
		expect(preview.nextElementSibling?.getAttribute('data-testid')).toBe(
			'board-task-task-a',
		)
		expect(
			screen.getByTestId('pending-sortable-context').getAttribute('data-items'),
		).toBe('task-a,task-b')
		expect(sortableCalls).toEqual(['task-a', 'task-b'])
		fireEvent.click(preview)
		fireEvent.keyDown(preview, { key: 'Enter' })
		expect(onOpenTask).not.toHaveBeenCalled()
		rerender(
			<BoardColumn
				column={{ ...column, tasks: [] }}
				pendingTasks={[pending]}
				onOpenTask={onOpenTask}
				activeDragTaskId={null}
			/>,
		)
		expect(screen.queryByText('Перетащите карточку сюда')).toBeNull()
		expect(
			screen.getByTestId('pending-sortable-context').getAttribute('data-items'),
		).toBe('')
		expect(screen.getByTestId('board-pending-task-local-1')).toBeDefined()
	})

	it.each(['priority', 'assignee'] as const)(
		'counts and renders pending in its %s lane while keeping DnD data real',
		(grouping) => {
			const task = createBoardTaskFixture({ assigneeId: null, assignee: null })
			const columns = [createBoardColumnFixture({ tasks: [task] })]
			const pending = createPendingTask({
				assigneeId: grouping === 'assignee' ? 'missing-person' : null,
			})
			const lanes = buildBoardLanes(grouping, columns, [], [pending])
			const target = lanes.find((lane) =>
				grouping === 'priority'
					? lane.priority === 'HIGH'
					: lane.assigneeId === 'missing-person',
			)!
			render(
				<Board
					columns={columns}
					pendingTasks={[pending]}
					grouping={grouping}
					lanes={lanes}
					onOpenTask={vi.fn()}
				/>,
			)
			const group = screen.getByRole('group', {
				name: `${target.label}: ${columns[0]!.title}`,
			})
			expect(within(group).getByTestId('board-pending-task-local-1')).toBeDefined()
			expect(within(group).queryByText('Нет задач')).toBeNull()
			const laneSection = screen
				.getByRole('heading', { name: target.label })
				.closest('section')!
			expect(
				within(laneSection).getByText(grouping === 'priority' ? '2' : '1'),
			).toBeDefined()
			expect(
				screen
					.getAllByTestId('pending-sortable-context')
					.map((context) => context.getAttribute('data-items'))
					.filter(Boolean),
			).toEqual(['task-a'])
			expect(new Set(sortableCalls)).toEqual(new Set(['task-a']))
		},
	)
})
