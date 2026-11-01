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

vi.mock('@repo/ui', () => ({
	Badge: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
		<span className={className}>{children}</span>
	),
	Avatar: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
		<div className={className}>{children}</div>
	),
	AvatarFallback: ({
		children,
		className,
	}: React.PropsWithChildren<{ className?: string }>) => (
		<span className={className}>{children}</span>
	),
	Card: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
		<article className={className}>{children}</article>
	),
	CardContent: ({
		children,
		className,
	}: React.PropsWithChildren<{ className?: string }>) => (
		<div className={className}>{children}</div>
	),
	cn: (...args: unknown[]) => boardCardMockState.buildClassName(args),
}))
