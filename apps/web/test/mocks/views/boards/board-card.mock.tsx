import { vi, type Mock } from 'vitest'

interface UseSortableInput {
	id: string
	data: {
		boardColumnId: string
		taskId: string
		type: string
	}
	disabled?: boolean
}

const boardCardMockState = vi.hoisted(() => ({
	isDragging: false,
	dragListeners: {
		onKeyDown: vi.fn(),
		onPointerDown: vi.fn(),
		onTouchStart: vi.fn(),
	},
	sortableCalls: [] as UseSortableInput[],
}))

export function resetBoardCardUnitMocks() {
	boardCardMockState.isDragging = false
	boardCardMockState.sortableCalls = []
	Object.values(boardCardMockState.dragListeners).forEach((listener) =>
		listener.mockClear(),
	)
}

export function setBoardCardIsDragging(value: boolean) {
	boardCardMockState.isDragging = value
}

export function getBoardCardSortableCalls() {
	return [...boardCardMockState.sortableCalls]
}

export function getBoardCardDragListeners(): Record<
	'onKeyDown' | 'onPointerDown' | 'onTouchStart',
	Mock
> {
	return boardCardMockState.dragListeners
}

vi.mock('@dnd-kit/sortable', () => ({
	useSortable: (input: UseSortableInput) => {
		boardCardMockState.sortableCalls.push(input)

		return {
			attributes: {
				'data-sortable-id': input.id,
			},
			isDragging: boardCardMockState.isDragging,
			listeners: input.disabled ? undefined : boardCardMockState.dragListeners,
			setNodeRef: () => undefined,
			transform: { x: 8, y: 12, scaleX: 1, scaleY: 1 },
			transition: 'transform 120ms ease',
		}
	},
}))

vi.mock('@dnd-kit/utilities', () => ({
	CSS: {
		Transform: {
			toString: (transform: unknown) =>
				transform ? 'translate3d(8px, 12px, 0)' : undefined,
		},
	},
}))
