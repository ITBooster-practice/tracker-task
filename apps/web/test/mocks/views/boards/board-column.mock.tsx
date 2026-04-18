import { vi } from 'vitest'

import type { BoardColumn, BoardTask } from '@/views/boards/model/types'

interface UseDroppableInput {
	data: {
		columnId: string
		type: string
	}
	disabled?: boolean
	id: string
}

interface BoardCardMockProps {
	columnId: string
	disabled?: boolean
	isActiveDragItem?: boolean
	onOpenTask: (taskId: string) => void
	task: BoardTask
}

const boardColumnMockState = vi.hoisted(() => ({
	boardCardProps: [] as BoardCardMockProps[],
	buildClassName: (args: unknown[]) =>
		args
			.flatMap((arg) => {
				if (typeof arg === 'string') {
					return [arg]
				}

				if (arg && typeof arg === 'object' && !Array.isArray(arg)) {
					return Object.entries(arg)
						.filter(([, value]) => Boolean(value))
						.map(([key]) => key)
				}

				return []
			})
			.join(' '),
	droppableCalls: [] as UseDroppableInput[],
	isOver: false,
}))

export function resetBoardColumnUnitMocks() {
	boardColumnMockState.boardCardProps = []
	boardColumnMockState.droppableCalls = []
	boardColumnMockState.isOver = false
}

export function setBoardColumnIsOver(value: boolean) {
	boardColumnMockState.isOver = value
}

export function getBoardColumnMockState() {
	return {
		boardCardProps: [...boardColumnMockState.boardCardProps],
		droppableCalls: [...boardColumnMockState.droppableCalls],
	}
}

vi.mock('@dnd-kit/core', () => ({
	useDroppable: (input: UseDroppableInput) => {
		boardColumnMockState.droppableCalls.push(input)

		return {
			isOver: boardColumnMockState.isOver,
			setNodeRef: () => undefined,
		}
	},
}))

vi.mock('@dnd-kit/sortable', () => ({
	SortableContext: ({
		children,
		items,
	}: React.PropsWithChildren<{ items: string[]; strategy: unknown }>) => (
		<div data-items={items.join(',')} data-testid='sortable-context'>
			{children}
		</div>
	),
	verticalListSortingStrategy: 'vertical-list-sorting-strategy',
}))

vi.mock('@repo/ui', () => ({
	cn: (...args: unknown[]) => boardColumnMockState.buildClassName(args),
}))

vi.mock('@/views/boards/ui/board-card', () => ({
	BoardCard: (props: BoardCardMockProps) => {
		boardColumnMockState.boardCardProps.push(props)

		return (
			<button
				type='button'
				data-active={String(Boolean(props.isActiveDragItem))}
				data-disabled={String(Boolean(props.disabled))}
				data-testid={`column-card-${props.task.id}`}
				onClick={() => props.onOpenTask(props.task.id)}
			>
				{props.task.title}
			</button>
		)
	},
}))

export type { BoardColumn }
