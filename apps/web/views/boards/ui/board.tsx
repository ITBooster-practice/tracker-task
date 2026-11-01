import {
	closestCorners,
	DndContext,
	DragOverlay,
	KeyboardSensor,
	PointerSensor,
	pointerWithin,
	TouchSensor,
	useSensor,
	useSensors,
	type CollisionDetection,
	type DragEndEvent,
	type DragOverEvent,
	type DragStartEvent,
	type KeyboardCoordinateGetter,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'

import { cn } from '@repo/ui'
import { ArrowLeftRight } from '@repo/ui/icons'

import {
	boardCellId,
	canDropInLane,
	keyboardLanePlacement,
	laneColumns,
	laneMoveFields,
	moveTaskInLane,
	parseBoardCellId,
	taskInLane,
	type BoardGrouping,
	type BoardLane,
} from '../model/board-swimlanes'
import { BOARD_COLUMN_CONTAINER_PREFIX } from '../model/constants'
import type { BoardColumn, BoardTask, BoardTaskMoveInput } from '../model/types'
import { findBoardTask, moveTaskInColumns } from '../model/utils'
import { BoardCard } from './board-card'
import { BoardColumn as BoardColumnView } from './board-column'
import { BoardColumnTasks } from './board-column-tasks'

interface BoardProps {
	columns: BoardColumn[]
	onOpenTask: (taskId: string) => void
	onMoveTask?: (input: BoardTaskMoveInput) => void | Promise<void>
	onCreateTask?: (columnId: string) => void
	disableInteraction?: boolean
	onConfigureColumn?: (columnId: string) => void
	columnActionsDisabled?: boolean
	columnTaskCounts?: Record<string, number>
	dragScope?: string
	grouping?: BoardGrouping
	lanes?: BoardLane[]
	emptyState?: ReactNode
}

interface PendingTaskDrop {
	placement: BoardTaskMoveInput
	lane?: BoardLane
	scope?: string
}

function hasDropPlacement(columns: BoardColumn[], { placement, lane }: PendingTaskDrop) {
	const target = columns.find((column) => column.id === placement.toColumnId)
	const tasks = lane
		? target?.tasks.filter((task) => taskInLane(task, lane))
		: target?.tasks
	const task = tasks?.[placement.toIndex]
	return (
		task?.id === placement.taskId &&
		(placement.priority === undefined || task.priority === placement.priority) &&
		(placement.assigneeId === undefined || task.assigneeId === placement.assigneeId)
	)
}

const swimlaneCollision: CollisionDetection = (args) => {
	const cells = args.droppableContainers.filter(
		(item) =>
			item.data.current?.type === 'column' && item.data.current?.laneKey !== undefined,
	)
	const cellCollisions = args.pointerCoordinates
		? pointerWithin({ ...args, droppableContainers: cells })
		: closestCorners({ ...args, droppableContainers: cells })
	const cell = cells.find((item) => item.id === cellCollisions[0]?.id)
	if (!cell) return []
	const tasks = args.droppableContainers.filter(
		(item) =>
			item.id !== args.active.id &&
			item.data.current?.type === 'task' &&
			item.data.current.boardColumnId === cell.data.current?.boardColumnId &&
			item.data.current.laneKey === cell.data.current?.laneKey,
	)
	const taskCollisions = closestCorners({ ...args, droppableContainers: tasks })
	return taskCollisions.length ? taskCollisions : cellCollisions
}

function isBelowTaskCenter(event: DragOverEvent | DragEndEvent) {
	const translated = event.active.rect.current.translated
	return Boolean(
		translated &&
		event.over &&
		translated.top + translated.height / 2 >
			event.over.rect.top + event.over.rect.height / 2,
	)
}

const lanePlacement = (
	columns: BoardColumn[],
	lanes: BoardLane[],
	event: DragOverEvent | DragEndEvent,
	taskId: string,
): BoardTaskMoveInput | null => {
	if (!event.over) return null
	const id = String(event.over.id)
	const cell = parseBoardCellId(id)
	const targetColumn = cell
		? columns.find((column) => column.id === cell.columnId)
		: columns.find((column) => column.tasks.some((task) => task.id === id))
	const overTask = targetColumn?.tasks.find((task) => task.id === id)
	const lane = cell
		? lanes.find((lane) => lane.key === cell.laneKey)
		: lanes.find((lane) => overTask && taskInLane(overTask, lane))
	if (!targetColumn || !lane) return null
	const tasks = targetColumn.tasks.filter(
		(task) => task.id !== taskId && taskInLane(task, lane),
	)
	const index = overTask
		? tasks.findIndex((task) => task.id === overTask.id)
		: tasks.length
	if (index < 0) return null
	const after = !cell && isBelowTaskCenter(event)
	return {
		taskId,
		toColumnId: targetColumn.id,
		toIndex: index + (after ? 1 : 0),
		...laneMoveFields(lane),
	}
}

const getColumnIdFromDroppableId = (droppableId: string) => {
	if (!droppableId.startsWith(`${BOARD_COLUMN_CONTAINER_PREFIX}:`)) {
		return null
	}

	return droppableId.slice(BOARD_COLUMN_CONTAINER_PREFIX.length + 1)
}

const getDragPlacement = (
	columns: BoardColumn[],
	event: DragOverEvent | DragEndEvent,
	activeTaskId: string,
) => {
	if (!event.over) {
		return null
	}

	const overId = String(event.over.id)
	const overColumnId = getColumnIdFromDroppableId(overId)

	if (overColumnId) {
		const targetColumn = columns.find((column) => column.id === overColumnId)

		if (!targetColumn) {
			return null
		}

		return {
			taskId: activeTaskId,
			toColumnId: overColumnId,
			toIndex: targetColumn.tasks.filter((task) => task.id !== activeTaskId).length,
		} satisfies BoardTaskMoveInput
	}

	for (const column of columns) {
		const overTaskIndex = column.tasks
			.filter((task) => task.id !== activeTaskId)
			.findIndex((task) => task.id === overId)

		if (overTaskIndex < 0) {
			continue
		}

		const isBelowTask = isBelowTaskCenter(event)

		return {
			taskId: activeTaskId,
			toColumnId: column.id,
			toIndex: overTaskIndex + (isBelowTask ? 1 : 0),
		} satisfies BoardTaskMoveInput
	}

	return null
}

function Board({
	columns,
	onOpenTask,
	onMoveTask,
	onCreateTask,
	disableInteraction = false,
	onConfigureColumn,
	columnActionsDisabled = false,
	columnTaskCounts,
	dragScope,
	grouping = 'none',
	lanes = [],
	emptyState,
}: BoardProps) {
	const boardId = useId()
	const grouped = grouping !== 'none'
	const originalTask = useRef<BoardTask | null>(null)
	const dragColumns = useRef(columns)
	const sessionScope = useRef(dragScope)
	const keyboardSession = useRef(false)
	const keyboardDrop = useRef<BoardTaskMoveInput | null>(null)
	const [restoreTaskFocus, setRestoreTaskFocus] = useState<string | null>(null)
	const [pendingDrop, setPendingDrop] = useState<PendingTaskDrop | null>(null)
	const mounted = useRef(true)
	useEffect(() => {
		mounted.current = true
		return () => {
			mounted.current = false
		}
	}, [])
	const scrollArea = useRef<HTMLDivElement>(null)
	const [canScroll, setCanScroll] = useState(false)
	useEffect(() => {
		const area = scrollArea.current
		if (!area) return
		const measure = () => setCanScroll(area.scrollWidth > area.clientWidth)
		measure()
		if (typeof ResizeObserver === 'undefined') return
		const observer = new ResizeObserver(measure)
		observer.observe(area)
		if (area.firstElementChild) observer.observe(area.firstElementChild)
		return () => observer.disconnect()
	}, [])
	const pendingPreview = useMemo(() => {
		if (
			!pendingDrop ||
			pendingDrop.scope !== dragScope ||
			hasDropPlacement(columns, pendingDrop) ||
			!findBoardTask(columns, pendingDrop.placement.taskId)
		)
			return null
		const preview = pendingDrop.lane
			? moveTaskInLane(columns, pendingDrop.placement, pendingDrop.lane)
			: moveTaskInColumns(columns, pendingDrop.placement)
		return preview === columns ? null : preview
	}, [columns, dragScope, pendingDrop])
	const isDropHandoff = pendingPreview !== null
	const isInteractionDisabled = disableInteraction || isDropHandoff || !onMoveTask
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(TouchSensor, {
			activationConstraint: {
				delay: 120,
				tolerance: 6,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: keyboardCoordinates,
			scrollBehavior: 'auto',
		}),
	)

	const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
	const [previewColumns, setPreviewColumns] = useState(columns)
	const latestPlacementRef = useRef<BoardTaskMoveInput | null>(null)
	const previousDragScope = useRef(dragScope)
	useEffect(() => {
		if (pendingDrop && !pendingPreview) setPendingDrop(null)
	}, [pendingDrop, pendingPreview])
	useEffect(() => {
		if (previousDragScope.current === dragScope) return
		previousDragScope.current = dragScope
		setActiveTaskId(null)
		setPreviewColumns(columns)
		dragColumns.current = columns
		keyboardDrop.current = null
		keyboardSession.current = false
		latestPlacementRef.current = null
	}, [columns, dragScope])

	useEffect(() => {
		if (activeTaskId === null) {
			setPreviewColumns(columns)
			dragColumns.current = columns
		}
	}, [activeTaskId, columns])

	const renderedColumns =
		activeTaskId !== null ? previewColumns : (pendingPreview ?? columns)
	useEffect(() => {
		if (
			restoreTaskFocus &&
			activeTaskId === null &&
			!disableInteraction &&
			!columnActionsDisabled
		) {
			const frame = requestAnimationFrame(() => {
				const target =
					document.getElementById(`board-task-${restoreTaskFocus}`) ?? scrollArea.current
				target?.focus()
				setRestoreTaskFocus(null)
			})
			return () => cancelAnimationFrame(frame)
		}
	}, [activeTaskId, disableInteraction, columnActionsDisabled, columns, restoreTaskFocus])
	const activeTask = useMemo(
		() => findBoardTask(renderedColumns, activeTaskId),
		[activeTaskId, renderedColumns],
	)

	const resetDragState = (restoreFocus = true) => {
		if (restoreFocus && keyboardSession.current && activeTaskId !== null)
			setRestoreTaskFocus(activeTaskId)
		setActiveTaskId(null)
		setPendingDrop(null)
		setPreviewColumns(columns)
		dragColumns.current = columns
		originalTask.current = null
		keyboardDrop.current = null
		keyboardSession.current = false
		latestPlacementRef.current = null
	}

	const handleDragStart = (event: DragStartEvent) => {
		sessionScope.current = dragScope
		if (isInteractionDisabled) {
			return
		}

		setActiveTaskId(String(event.active.id))
		setPreviewColumns(columns)
		dragColumns.current = columns
		originalTask.current = findBoardTask(columns, String(event.active.id))
		keyboardSession.current = event.activatorEvent?.type === 'keydown'
		if (grouped && keyboardSession.current && originalTask.current) {
			const task = originalTask.current
			const lane = lanes.find((item) => taskInLane(task, item))
			if (lane)
				keyboardDrop.current = {
					taskId: task.id,
					toColumnId: task.boardColumnId,
					toIndex: columns
						.find((column) => column.id === task.boardColumnId)!
						.tasks.filter((item) => taskInLane(item, lane))
						.findIndex((item) => item.id === task.id),
					...laneMoveFields(lane),
				}
		}
		latestPlacementRef.current = null
	}

	const handleDragOver = (event: DragOverEvent) => {
		if (isInteractionDisabled || activeTaskId === null) {
			return
		}
		if (grouped && keyboardSession.current) return

		const nextPlacement = grouped
			? lanePlacement(dragColumns.current, lanes, event, activeTaskId)
			: getDragPlacement(dragColumns.current, event, activeTaskId)

		if (!nextPlacement) {
			if (grouped) latestPlacementRef.current = null
			return
		}
		if (grouped) {
			const lane = lanes.find((item) =>
				taskInLane({ ...originalTask.current!, ...nextPlacement }, item),
			)
			if (!lane || !canDropInLane(originalTask.current, lane)) {
				latestPlacementRef.current = null
				return
			}
			const nextColumns = moveTaskInLane(dragColumns.current, nextPlacement, lane)
			dragColumns.current = nextColumns
			setPreviewColumns(nextColumns)
			latestPlacementRef.current = nextPlacement
			return
		}

		const nextColumns = moveTaskInColumns(dragColumns.current, nextPlacement)
		dragColumns.current = nextColumns
		setPreviewColumns(nextColumns)
		latestPlacementRef.current = nextPlacement
	}

	const handleDragEnd = (event: DragEndEvent) => {
		if (sessionScope.current !== dragScope) {
			resetDragState()
			return
		}
		if (isInteractionDisabled || activeTaskId === null) {
			resetDragState()
			return
		}

		const finalPlacement = grouped
			? keyboardSession.current
				? keyboardDrop.current
				: lanePlacement(dragColumns.current, lanes, event, activeTaskId)
			: (getDragPlacement(dragColumns.current, event, activeTaskId) ??
				latestPlacementRef.current)
		let finalLane: BoardLane | undefined
		if (grouped && finalPlacement) {
			finalLane = lanes.find(
				(item) =>
					originalTask.current &&
					taskInLane({ ...originalTask.current, ...finalPlacement }, item),
			)
			if (!finalLane || !canDropInLane(originalTask.current, finalLane)) {
				resetDragState()
				return
			}
		}

		const focusTaskId = keyboardSession.current ? activeTaskId : null
		const completion = finalPlacement ? onMoveTask?.(finalPlacement) : undefined
		const drop: PendingTaskDrop | null =
			finalPlacement && completion
				? {
						placement: finalPlacement,
						lane: finalLane,
						scope: dragScope,
					}
				: null
		resetDragState(false)
		if (drop) setPendingDrop(drop)
		if (drop || focusTaskId) {
			const restore = () => {
				// Let batched query notifications render the final task location first.
				setTimeout(() => {
					if (!mounted.current) return
					setPendingDrop((current) => (current === drop ? null : current))
					if (focusTaskId) setRestoreTaskFocus(focusTaskId)
				}, 0)
			}
			void Promise.resolve(completion).then(restore, restore)
		}
	}

	function keyboardCoordinates(
		event: KeyboardEvent,
		args: Parameters<KeyboardCoordinateGetter>[1],
	) {
		if (!grouped) return sortableKeyboardCoordinates(event, args)
		if (
			!keyboardSession.current ||
			!keyboardDrop.current ||
			!originalTask.current ||
			sessionScope.current !== dragScope
		)
			return
		const next = keyboardLanePlacement(
			dragColumns.current,
			lanes,
			keyboardDrop.current,
			originalTask.current,
			event.code,
		)
		if (!next) return
		event.preventDefault()
		const lane = lanes.find((item) =>
			taskInLane({ ...originalTask.current!, ...next }, item),
		)!
		const nextColumns = moveTaskInLane(dragColumns.current, next, lane)
		dragColumns.current = nextColumns
		setPreviewColumns(nextColumns)
		keyboardDrop.current = next
		latestPlacementRef.current = next
		const rect = args.context.droppableRects.get(boardCellId(lane, next.toColumnId))
		return rect ? { x: rect.left, y: rect.top } : undefined
	}

	return (
		<>
			<DndContext
				sensors={sensors}
				collisionDetection={grouped ? swimlaneCollision : closestCorners}
				onDragStart={handleDragStart}
				onDragOver={handleDragOver}
				onDragMove={handleDragOver}
				onDragEnd={handleDragEnd}
				onDragCancel={() => resetDragState()}
			>
				<div
					className={
						emptyState
							? 'grid min-h-min flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[3.5rem_minmax(min-content,1fr)_auto]'
							: 'flex min-h-80 flex-1 flex-col'
					}
				>
					<div
						ref={scrollArea}
						className={cn(
							'min-h-0 overflow-auto pb-3',
							emptyState ? 'col-start-1 row-span-2 row-start-1' : 'flex-1',
						)}
						tabIndex={0}
						role='region'
						aria-label='Колонки доски'
					>
						<div className={emptyState ? 'w-full' : 'min-w-max'}>
							<div
								className={
									grouped
										? 'sticky top-0 z-10 flex items-start gap-3 bg-background xl:gap-4'
										: 'flex items-start gap-3 xl:gap-4'
								}
							>
								{renderedColumns.map((column) => (
									<BoardColumnView
										key={column.id}
										headerOnly={grouped || Boolean(emptyState)}
										stretch={Boolean(emptyState)}
										column={column}
										totalTasks={columnTaskCounts?.[column.id]}
										onOpenTask={onOpenTask}
										onCreateTask={
											onCreateTask ? () => onCreateTask(column.id) : undefined
										}
										activeDragTaskId={activeTaskId}
										disabled={isInteractionDisabled}
										onConfigure={
											onConfigureColumn ? () => onConfigureColumn(column.id) : undefined
										}
										actionsDisabled={columnActionsDisabled || activeTaskId !== null}
									/>
								))}
							</div>
							{grouped &&
								!emptyState &&
								lanes.map((lane) => {
									const projected = laneColumns(renderedColumns, lane)
									const labelId = `${boardId}-${encodeURIComponent(lane.key)}`
									return (
										<section
											key={lane.key}
											aria-labelledby={labelId}
											className='mt-6 space-y-3'
										>
											<div className='flex items-center gap-2 px-2'>
												<h2
													id={labelId}
													className='text-xl font-semibold text-foreground'
												>
													{lane.label}
												</h2>
												<span className='text-sm text-muted-foreground'>
													{projected.reduce(
														(count, column) => count + column.tasks.length,
														0,
													)}
												</span>
											</div>
											{!lane.assignable && (
												<p className='px-2 text-sm text-muted-foreground'>
													Участник недоступен для новых назначений.
												</p>
											)}
											<div className='flex items-stretch gap-3 xl:gap-4'>
												{projected.map((column) => (
													<div
														key={column.id}
														className='flex w-[310px] shrink-0 flex-col sm:w-[300px] xl:w-[330px]'
													>
														<BoardColumnTasks
															column={column}
															lane={lane}
															onOpenTask={onOpenTask}
															activeDragTaskId={activeTaskId}
															disabled={isInteractionDisabled}
															dropDisabled={!canDropInLane(originalTask.current, lane)}
														/>
													</div>
												))}
											</div>
										</section>
									)
								})}
						</div>
					</div>
					{emptyState && (
						<div className='pointer-events-none z-10 col-start-1 row-start-2 flex min-h-80 items-center justify-center px-4 pt-8 pb-20'>
							<div className='pointer-events-auto w-full max-w-[560px]'>{emptyState}</div>
						</div>
					)}
					{canScroll && (
						<p
							className={cn(
								'flex shrink-0 items-center gap-2 border-t border-border pt-2 text-xs text-muted-foreground',
								emptyState && 'col-start-1 row-start-3',
							)}
						>
							<ArrowLeftRight aria-hidden className='size-3' />
							Прокрутите доску по горизонтали, чтобы увидеть остальные колонки.
						</p>
					)}
				</div>

				<DragOverlay>
					{activeTask ? (
						<div className='w-full'>
							<BoardCard
								task={activeTask}
								boardColumnId={activeTask.boardColumnId}
								laneKey={
									grouped
										? lanes.find((lane) => taskInLane(activeTask, lane))?.key
										: undefined
								}
								onOpenTask={onOpenTask}
								isDragOverlay
							/>
						</div>
					) : null}
				</DragOverlay>
			</DndContext>
		</>
	)
}

export { Board }
