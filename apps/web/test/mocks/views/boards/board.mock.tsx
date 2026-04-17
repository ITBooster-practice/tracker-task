import { vi } from 'vitest'

import type {
	BoardColumn,
	BoardTask,
	BoardTaskMoveInput,
} from '@/views/boards/model/types'

interface DragStartMockEvent {
	active: {
		id: string
	}
}

interface DragMoveMockEvent {
	active: {
		id: string
		rect: {
			current: {
				translated?: { top: number } | null
			}
		}
	}
	over: {
		id: string
		rect: {
			height: number
			top: number
		}
	} | null
}

interface DndContextMockProps {
	children: React.ReactNode
	collisionDetection: unknown
	onDragCancel: () => void
	onDragEnd: (event: DragMoveMockEvent) => void
	onDragOver: (event: DragMoveMockEvent) => void
	onDragStart: (event: DragStartMockEvent) => void
	sensors: unknown[]
}

interface BoardColumnMockProps {
	activeDragTaskId: string | null
	column: BoardColumn
	disabled?: boolean
	onOpenTask: (taskId: string) => void
}

interface BoardCardMockProps {
	columnId: string
	isDragOverlay?: boolean
	onOpenTask: (taskId: string) => void
	task: BoardTask
}

interface SensorMockCall {
	options?: unknown
	sensor: unknown
}

const boardMockState = vi.hoisted(() => ({
	boardCardProps: [] as BoardCardMockProps[],
	boardColumnProps: [] as BoardColumnMockProps[],
	dndContextProps: null as DndContextMockProps | null,
	sensorCalls: [] as SensorMockCall[],
}))

export function resetBoardUnitMocks() {
	boardMockState.boardCardProps = []
	boardMockState.boardColumnProps = []
	boardMockState.dndContextProps = null
	boardMockState.sensorCalls = []
}

export function getBoardUnitMockState() {
	return {
		boardCardProps: [...boardMockState.boardCardProps],
		boardColumnProps: [...boardMockState.boardColumnProps],
		dndContextProps: boardMockState.dndContextProps,
		sensorCalls: [...boardMockState.sensorCalls],
	}
}

vi.mock('@dnd-kit/core', () => {
	const activeTaskId = 'task-a'
	const targetTaskId = 'task-b'
	const doneColumnId = 'board-column:DONE'

	const createActiveRect = (top: number): DragMoveMockEvent['active'] => ({
		id: activeTaskId,
		rect: {
			current: {
				translated: { top },
			},
		},
	})

	const createColumnDropEvent = (): DragMoveMockEvent => ({
		active: createActiveRect(0),
		over: {
			id: doneColumnId,
			rect: {
				height: 96,
				top: 0,
			},
		},
	})

	const createTaskDropEvent = (): DragMoveMockEvent => ({
		active: createActiveRect(80),
		over: {
			id: targetTaskId,
			rect: {
				height: 60,
				top: 0,
			},
		},
	})

	return {
		DragOverlay: ({ children }: React.PropsWithChildren) => (
			<div data-testid='drag-overlay'>{children}</div>
		),
		DndContext: (props: DndContextMockProps) => {
			boardMockState.dndContextProps = props

			return (
				<div data-testid='dnd-context'>
					<button
						type='button'
						data-testid='drag-start'
						onClick={() =>
							props.onDragStart({
								active: { id: activeTaskId },
							})
						}
					>
						start
					</button>
					<button
						type='button'
						data-testid='drag-over-column'
						onClick={() => props.onDragOver(createColumnDropEvent())}
					>
						over column
					</button>
					<button
						type='button'
						data-testid='drag-end-column'
						onClick={() => props.onDragEnd(createColumnDropEvent())}
					>
						end column
					</button>
					<button
						type='button'
						data-testid='drag-end-task'
						onClick={() => props.onDragEnd(createTaskDropEvent())}
					>
						end task
					</button>
					<button
						type='button'
						data-testid='drag-end-empty'
						onClick={() =>
							props.onDragEnd({
								active: createActiveRect(0),
								over: null,
							})
						}
					>
						end empty
					</button>
					<button type='button' data-testid='drag-cancel' onClick={props.onDragCancel}>
						cancel
					</button>
					{props.children}
				</div>
			)
		},
		PointerSensor: 'PointerSensor',
		TouchSensor: 'TouchSensor',
		closestCorners: 'closestCorners',
		useSensor: (sensor: unknown, options?: unknown) => {
			boardMockState.sensorCalls.push({ options, sensor })
			return { options, sensor }
		},
		useSensors: (...sensors: unknown[]) => sensors,
	}
})

vi.mock('@/views/boards/ui/board-column', () => ({
	BoardColumn: (props: BoardColumnMockProps) => {
		boardMockState.boardColumnProps.push(props)

		return (
			<section
				data-active-task-id={props.activeDragTaskId ?? ''}
				data-disabled={String(Boolean(props.disabled))}
				data-testid={`board-column-${props.column.id}`}
			>
				{props.column.tasks.map((task) => (
					<button key={task.id} type='button' onClick={() => props.onOpenTask(task.id)}>
						{task.title}
					</button>
				))}
			</section>
		)
	},
}))

vi.mock('@/views/boards/ui/board-card', () => ({
	BoardCard: (props: BoardCardMockProps) => {
		boardMockState.boardCardProps.push(props)

		return (
			<div
				data-column-id={props.columnId}
				data-overlay={String(Boolean(props.isDragOverlay))}
				data-testid={`overlay-card-${props.task.id}`}
			>
				{props.task.title}
			</div>
		)
	},
}))

export type { BoardTaskMoveInput }
