import {
	closestCorners,
	DndContext,
	DragOverlay,
	KeyboardSensor,
	PointerSensor,
	TouchSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
	type DragOverEvent,
	type DragStartEvent,
} from '@dnd-kit/core'
import {
	arrayMove,
	horizontalListSortingStrategy,
	SortableContext,
} from '@dnd-kit/sortable'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@repo/ui'
import { Plus } from '@repo/ui/icons'

import { isApiError } from '@/shared/lib/api/utils'

import {
	columnAwareCollision,
	columnKeyboardCoordinates,
	reorderColumnId,
} from '../model/column-drag'
import {
	BOARD_COLUMN_CONTAINER_PREFIX,
	BOARD_COLUMN_ORDER_PREFIX,
} from '../model/constants'
import type { BoardColumn, BoardTaskMoveInput } from '../model/types'
import { findBoardTask, moveTaskInColumns } from '../model/utils'
import { BoardCard } from './board-card'
import { BoardColumn as BoardColumnView } from './board-column'
import { BoardColumnTitleForm } from './board-column-title-form'
import { DeleteBoardColumnDialog } from './delete-board-column-dialog'
import { SortableBoardColumn } from './sortable-board-column'

interface BoardProps {
	columns: BoardColumn[]
	onOpenTask: (taskId: string) => void
	onMoveTask?: (input: BoardTaskMoveInput) => void
	onCreateTask?: () => void
	disableInteraction?: boolean
	onCreateColumn?: (title: string) => Promise<void>
	onRenameColumn?: (columnId: string, title: string) => Promise<void>
	columnActionsDisabled?: boolean
	onDeleteColumn?: (columnId: string, targetColumnId: string) => Promise<void>
	onReorderColumns?: (columnIds: string[]) => Promise<void>
	dragScope?: string
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
}: BoardProps) {
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
			coordinateGetter: columnKeyboardCoordinates,
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
		latestPlacementRef.current = null
	}, [columns, dragScope])

	useEffect(() => {
		if (activeTaskId === null) {
			setPreviewColumns(columns)
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
	const activeTask = useMemo(
		() => findBoardTask(renderedColumns, activeTaskId),
		[activeTaskId, renderedColumns],
	)

	const resetDragState = () => {
		setActiveTaskId(null)
		setActiveColumnId(null)
		setPreviewColumns(columns)
		latestPlacementRef.current = null
	}

	const handleDragStart = (event: DragStartEvent) => {
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
		latestPlacementRef.current = null
	}

	const handleDragOver = (event: DragOverEvent) => {
		if (isInteractionDisabled || activeTaskId === null) {
			return
		}

		const nextPlacement = getDragPlacement(previewColumns, event, activeTaskId)

		if (!nextPlacement) {
			return
		}

		setPreviewColumns((currentColumns) => {
			const nextColumns = moveTaskInColumns(currentColumns, nextPlacement)
			latestPlacementRef.current = nextPlacement
			return nextColumns
		})
	}

	const handleDragEnd = (event: DragEndEvent) => {
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

		const finalPlacement =
			getDragPlacement(previewColumns, event, activeTaskId) ?? latestPlacementRef.current

		if (finalPlacement) {
			onMoveTask?.(finalPlacement)
		}

		resetDragState()
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
				collisionDetection={onReorderColumns ? columnAwareCollision : closestCorners}
				onDragStart={handleDragStart}
				onDragOver={handleDragOver}
				onDragEnd={handleDragEnd}
				onDragCancel={resetDragState}
			>
				<div className='overflow-x-auto pb-2'>
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
