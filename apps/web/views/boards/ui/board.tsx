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
import {
	arrayMove,
	horizontalListSortingStrategy,
	SortableContext,
} from '@dnd-kit/sortable'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { Button } from '@repo/ui'
import { Plus } from '@repo/ui/icons'

import { isApiError } from '@/shared/lib/api/utils'

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
import {
	columnAwareCollision,
	columnKeyboardCoordinates,
	reorderColumnId,
} from '../model/column-drag'
import {
	BOARD_COLUMN_CONTAINER_PREFIX,
	BOARD_COLUMN_ORDER_PREFIX,
} from '../model/constants'
import type { BoardColumn, BoardTask, BoardTaskMoveInput } from '../model/types'
import { findBoardTask, moveTaskInColumns } from '../model/utils'
import { BoardCard } from './board-card'
import { BoardColumn as BoardColumnView } from './board-column'
import { BoardColumnTasks } from './board-column-tasks'
import { BoardColumnTitleForm } from './board-column-title-form'
import { DeleteBoardColumnDialog } from './delete-board-column-dialog'
import { SortableBoardColumn } from './sortable-board-column'

interface BoardProps {
	columns: BoardColumn[]
	onOpenTask: (taskId: string) => void
	onMoveTask?: (input: BoardTaskMoveInput) => void | Promise<void>
	onCreateTask?: () => void
	disableInteraction?: boolean
	onCreateColumn?: (title: string) => Promise<void>
	onRenameColumn?: (columnId: string, title: string) => Promise<void>
	columnActionsDisabled?: boolean
	onDeleteColumn?: (columnId: string, targetColumnId: string) => Promise<void>
	onReorderColumns?: (columnIds: string[]) => Promise<void>
	dragScope?: string
	grouping?: BoardGrouping
	lanes?: BoardLane[]
}

const swimlaneCollision: CollisionDetection = (args) => {
	if (reorderColumnId(String(args.active.id)) !== null) return columnAwareCollision(args)
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
	const translated = event.active.rect.current.translated
	const after =
		!cell &&
		translated !== null &&
		translated !== undefined &&
		translated.top > event.over.rect.top + event.over.rect.height / 2
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

		const isPointerBelowTask =
			event.active.rect.current.translated !== null &&
			event.active.rect.current.translated !== undefined &&
			event.active.rect.current.translated.top >
				event.over.rect.top + event.over.rect.height / 2

		return {
			taskId: activeTaskId,
			toColumnId: column.id,
			toIndex: overTaskIndex + (isPointerBelowTask ? 1 : 0),
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
	onCreateColumn,
	onRenameColumn,
	columnActionsDisabled = false,
	onDeleteColumn,
	onReorderColumns,
	dragScope,
	grouping = 'none',
	lanes = [],
}: BoardProps) {
	const boardId = useId()
	const grouped = grouping !== 'none'
	const originalTask = useRef<BoardTask | null>(null)
	const dragColumns = useRef(columns)
	const sessionScope = useRef(dragScope)
	const keyboardSession = useRef(false)
	const keyboardDrop = useRef<BoardTaskMoveInput | null>(null)
	const [restoreTaskFocus, setRestoreTaskFocus] = useState<string | null>(null)
	const [isAddingColumn, setIsAddingColumn] = useState(false)
	const [editingColumnId, setEditingColumnId] = useState<string | null>(null)
	const [deletingColumnId, setDeletingColumnId] = useState<string | null>(null)
	const [activeColumnId, setActiveColumnId] = useState<string | null>(null)
	const [pendingOrder, setPendingOrder] = useState<string[] | null>(null)
	const [orderError, setOrderError] = useState<string | null>(null)
	const reorderBusy = useRef(false)
	const mounted = useRef(true)
	const deleteReturnFocus = useRef<HTMLElement | null>(null)
	useEffect(() => {
		mounted.current = true
		return () => {
			mounted.current = false
		}
	}, [])
	const createTrigger = useRef<HTMLButtonElement>(null)
	const wasAdding = useRef(false)
	useEffect(() => {
		if (wasAdding.current && !isAddingColumn) createTrigger.current?.focus()
		wasAdding.current = isAddingColumn
	}, [isAddingColumn])
	useEffect(() => {
		if (
			editingColumnId !== null &&
			!columns.some((column) => column.id === editingColumnId)
		)
			setEditingColumnId(null)
	}, [columns, editingColumnId])
	useEffect(() => {
		if (
			deletingColumnId !== null &&
			!columns.some((column) => column.id === deletingColumnId)
		)
			setDeletingColumnId(null)
	}, [columns, deletingColumnId])
	const isColumnEditing =
		isAddingColumn || editingColumnId !== null || deletingColumnId !== null
	const isInteractionDisabled =
		disableInteraction ||
		!onMoveTask ||
		isColumnEditing ||
		activeColumnId !== null ||
		pendingOrder !== null
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
		if (previousDragScope.current === dragScope) return
		previousDragScope.current = dragScope
		setActiveTaskId(null)
		setActiveColumnId(null)
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

	const orderPositions = new Map(pendingOrder?.map((id, index) => [id, index]))
	const renderedColumns =
		activeTaskId !== null
			? previewColumns
			: pendingOrder
				? [...columns].sort(
						(a, b) =>
							(orderPositions.get(a.id) ?? columns.length) -
							(orderPositions.get(b.id) ?? columns.length),
					)
				: columns
	const columnToDelete = columns.find((column) => column.id === deletingColumnId)
	const activeColumn = columns.find((column) => column.id === activeColumnId)
	useEffect(() => {
		if (
			restoreTaskFocus &&
			activeTaskId === null &&
			!disableInteraction &&
			!columnActionsDisabled
		) {
			const frame = requestAnimationFrame(() => {
				const target =
					document.getElementById(`board-task-handle-${restoreTaskFocus}`) ??
					createTrigger.current
				if (target instanceof HTMLButtonElement && target.disabled) return
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
		setActiveColumnId(null)
		setPreviewColumns(columns)
		dragColumns.current = columns
		originalTask.current = null
		keyboardDrop.current = null
		keyboardSession.current = false
		latestPlacementRef.current = null
	}

	const handleDragStart = (event: DragStartEvent) => {
		sessionScope.current = dragScope
		const columnId = reorderColumnId(String(event.active.id))
		if (columnId !== null) {
			if (
				!onReorderColumns ||
				columnActionsDisabled ||
				isColumnEditing ||
				reorderBusy.current ||
				disableInteraction
			)
				return
			if (!columns.some((column) => column.id === columnId)) return
			setOrderError(null)
			setActiveColumnId(columnId)
			return
		}
		if (isInteractionDisabled) {
			return
		}

		setActiveTaskId(String(event.active.id))
		setPreviewColumns(columns)
		dragColumns.current = columns
		originalTask.current = findBoardTask(columns, String(event.active.id))
		keyboardSession.current = grouped && event.activatorEvent?.type === 'keydown'
		if (keyboardSession.current && originalTask.current) {
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
			: getDragPlacement(previewColumns, event, activeTaskId)

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

		setPreviewColumns((currentColumns) => {
			const nextColumns = moveTaskInColumns(currentColumns, nextPlacement)
			latestPlacementRef.current = nextPlacement
			return nextColumns
		})
	}

	const handleDragEnd = (event: DragEndEvent) => {
		if (sessionScope.current !== dragScope) {
			resetDragState()
			return
		}
		if (reorderColumnId(String(event.active.id)) !== null) {
			const sourceId = activeColumnId
			resetDragState()
			if (
				!sourceId ||
				!onReorderColumns ||
				columnActionsDisabled ||
				disableInteraction ||
				reorderBusy.current ||
				!event.over
			)
				return
			const targetId = reorderColumnId(String(event.over.id))
			const from = columns.findIndex((column) => column.id === sourceId)
			const to = columns.findIndex((column) => column.id === targetId)
			if (from < 0 || to < 0 || from === to) return
			const nextOrder = arrayMove(
				columns.map((column) => column.id),
				from,
				to,
			)
			reorderBusy.current = true
			setPendingOrder(nextOrder)
			void onReorderColumns(nextOrder)
				.catch((cause) => {
					if (mounted.current)
						setOrderError(
							isApiError(cause) && cause.statusCode === 403
								? 'Изменять порядок колонок могут владелец и администратор команды.'
								: isApiError(cause) && [400, 404, 409].includes(cause.statusCode)
									? 'Структура доски изменилась. Проверьте порядок и повторите перенос.'
									: 'Не удалось сохранить порядок колонок. Повторите перенос.',
						)
				})
				.finally(() => {
					reorderBusy.current = false
					if (mounted.current) setPendingOrder(null)
				})
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
			: (getDragPlacement(previewColumns, event, activeTaskId) ??
				latestPlacementRef.current)
		if (grouped && finalPlacement) {
			const lane = lanes.find(
				(item) =>
					originalTask.current &&
					taskInLane({ ...originalTask.current, ...finalPlacement }, item),
			)
			if (!lane || !canDropInLane(originalTask.current, lane)) {
				resetDragState()
				return
			}
		}

		const focusTaskId = keyboardSession.current ? activeTaskId : null
		const completion = finalPlacement ? onMoveTask?.(finalPlacement) : undefined
		resetDragState(false)
		if (focusTaskId) {
			const restore = () => {
				// Let batched query notifications render the final task location first.
				setTimeout(() => {
					if (mounted.current) setRestoreTaskFocus(focusTaskId)
				}, 0)
			}
			void Promise.resolve(completion).then(restore, restore)
		}
	}

	function keyboardCoordinates(
		event: KeyboardEvent,
		args: Parameters<KeyboardCoordinateGetter>[1],
	) {
		if (reorderColumnId(String(args.active)) !== null)
			return columnKeyboardCoordinates(event, args)
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
			{orderError && (
				<p role='alert' className='text-sm text-destructive'>
					{orderError}
				</p>
			)}
			<DndContext
				sensors={sensors}
				collisionDetection={
					grouped
						? swimlaneCollision
						: onReorderColumns
							? columnAwareCollision
							: closestCorners
				}
				onDragStart={handleDragStart}
				onDragOver={handleDragOver}
				onDragEnd={handleDragEnd}
				onDragCancel={() => resetDragState()}
			>
				<div className='overflow-x-auto pb-2'>
					<div className='min-w-max'>
						<SortableContext
							items={renderedColumns.map(
								(column) => `${BOARD_COLUMN_ORDER_PREFIX}:${column.id}`,
							)}
							strategy={horizontalListSortingStrategy}
						>
							<div className='flex min-w-max items-start gap-4'>
								{renderedColumns.map((column) => {
									const actionsDisabled =
										columnActionsDisabled ||
										isColumnEditing ||
										activeTaskId !== null ||
										activeColumnId !== null ||
										pendingOrder !== null
									const props = {
										headerOnly: grouped,
										column,
										onOpenTask,
										onCreateTask,
										activeDragTaskId: activeTaskId,
										disabled: isInteractionDisabled,
										onEditTitle: onRenameColumn
											? () => setEditingColumnId(column.id)
											: undefined,
										onDelete:
											onDeleteColumn && !column.isSystem
												? () => {
														deleteReturnFocus.current =
															document.activeElement instanceof HTMLElement
																? document.activeElement
																: null
														setDeletingColumnId(column.id)
													}
												: undefined,
										editTitleDisabled: actionsDisabled,
										titleEditor:
											editingColumnId === column.id && onRenameColumn ? (
												<BoardColumnTitleForm
													columnId={column.id}
													initialTitle={column.title}
													columns={columns}
													disabled={columnActionsDisabled || pendingOrder !== null}
													onSubmit={(title) => onRenameColumn(column.id, title)}
													onDone={() => setEditingColumnId(null)}
												/>
											) : undefined,
									}
									return onReorderColumns ? (
										<SortableBoardColumn
											key={column.id}
											{...props}
											sortingDisabled={
												disableInteraction ||
												columnActionsDisabled ||
												isColumnEditing ||
												activeTaskId !== null ||
												pendingOrder !== null ||
												columns.length < 2
											}
										/>
									) : (
										<BoardColumnView key={column.id} {...props} />
									)
								})}
								{onCreateColumn && (
									<div key='create-column-control' className='w-[260px] shrink-0'>
										{isAddingColumn ? (
											<div className='rounded-[var(--radius-surface)] border border-border bg-card p-4'>
												<BoardColumnTitleForm
													columns={columns}
													disabled={columnActionsDisabled}
													onSubmit={onCreateColumn}
													onDone={() => setIsAddingColumn(false)}
												/>
											</div>
										) : (
											<Button
												ref={createTrigger}
												variant='outline'
												className='w-full'
												disabled={
													columnActionsDisabled ||
													isColumnEditing ||
													activeTaskId !== null ||
													activeColumnId !== null ||
													pendingOrder !== null
												}
												onClick={() => setIsAddingColumn(true)}
											>
												<Plus aria-hidden='true' />
												Добавить колонку
											</Button>
										)}
									</div>
								)}
							</div>
						</SortableContext>
						{grouped &&
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
											<h2 id={labelId} className='text-xl font-semibold text-foreground'>
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
										<div className='flex items-stretch gap-4'>
											{projected.map((column) => (
												<div key={column.id} className='flex w-[260px] shrink-0 flex-col'>
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

				<DragOverlay>
					{activeColumn ? (
						<div
							aria-hidden='true'
							className='w-[260px] rounded-[var(--radius-surface)] border border-border bg-card p-4 shadow-lg'
						>
							<p className='text-lg font-semibold break-words'>{activeColumn.title}</p>
							<p className='text-sm text-muted-foreground'>
								Задач: {activeColumn.tasks.length}
							</p>
						</div>
					) : null}
					{activeTask ? (
						<div className='w-[260px]'>
							<BoardCard
								task={activeTask}
								boardColumnId={activeTask.boardColumnId}
								onOpenTask={onOpenTask}
								isDragOverlay
							/>
						</div>
					) : null}
				</DragOverlay>
			</DndContext>
			{columnToDelete && onDeleteColumn && (
				<DeleteBoardColumnDialog
					key={columnToDelete.id}
					column={columnToDelete}
					columns={columns}
					disabled={columnActionsDisabled}
					onConfirm={(targetId) => onDeleteColumn(columnToDelete.id, targetId)}
					onClose={() => setDeletingColumnId(null)}
					onRestoreFocus={() => {
						const target = deleteReturnFocus.current
						if (target?.isConnected) target.focus()
						else createTrigger.current?.focus()
					}}
				/>
			)}
		</>
	)
}

export { Board }
