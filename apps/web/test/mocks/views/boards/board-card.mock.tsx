import { vi } from 'vitest'

interface UseSortableInput {
	id: string
	data: {
		columnId: string
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
	sortableCalls: [] as UseSortableInput[],
}))

export function resetBoardCardUnitMocks() {
	boardCardMockState.isDragging = false
	boardCardMockState.sortableCalls = []
}

export function setBoardCardIsDragging(value: boolean) {
	boardCardMockState.isDragging = value
}

export function getBoardCardSortableCalls() {
	return [...boardCardMockState.sortableCalls]
}

vi.mock('@dnd-kit/sortable', () => ({
	useSortable: (input: UseSortableInput) => {
		boardCardMockState.sortableCalls.push(input)

		return {
			attributes: {
				'data-sortable-id': input.id,
			},
			isDragging: boardCardMockState.isDragging,
			listeners: {
				'data-dnd-listener': 'true',
			},
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

vi.mock('@repo/ui/icons', () => ({
	GripVertical: ({ className }: { className?: string }) => (
		<span className={className} data-testid='icon-grip' />
	),
	MessageSquare: ({ className }: { className?: string }) => (
		<span className={className} data-testid='icon-message' />
	),
	SquareCheckBig: ({ className }: { className?: string }) => (
		<span className={className} data-testid='icon-checklist' />
	),
}))

vi.mock('@/entities/task', () => ({
	TaskPriorityBadge: ({ priority }: { priority: string }) => (
		<span data-testid='priority-badge'>{priority}</span>
	),
	TaskTypeBadge: ({ type }: { type: string }) => (
		<span data-testid='type-badge'>{type}</span>
	),
}))
