import {
	closestCorners,
	DndContext,
	DragOverlay,
	PointerSensor,
	TouchSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
	type DragOverEvent,
	type DragStartEvent,
} from '@dnd-kit/core'
import { useEffect, useMemo, useRef, useState } from 'react'

import { getBoardColumnContainerId } from '../model/constants'
import type { BoardColumn, BoardColumnId, BoardTaskMoveInput } from '../model/types'
import { findBoardTask, moveTaskInColumns } from '../model/utils'
import { BoardCard } from './board-card'
import { BoardColumn as BoardColumnView } from './board-column'

interface BoardProps {
	columns: BoardColumn[]
	onOpenTask: (taskId: string) => void
	onMoveTask: (input: BoardTaskMoveInput) => void
	disableInteraction?: boolean
}

const BOARD_COLUMN_ID_PREFIX = getBoardColumnContainerId('BACKLOG').split(':')[0]

const getColumnIdFromDroppableId = (droppableId: string) => {
	if (!droppableId.startsWith(`${BOARD_COLUMN_ID_PREFIX}:`)) {
		return null
	}

	return droppableId.split(':')[1] as BoardColumnId
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
			toIndex: targetColumn.tasks.length,
		} satisfies BoardTaskMoveInput
	}

	for (const column of columns) {
		const overTaskIndex = column.tasks.findIndex((task) => task.id === overId)

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
	disableInteraction = false,
}: BoardProps) {
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
	)

	const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
	const [previewColumns, setPreviewColumns] = useState(columns)
	const latestPlacementRef = useRef<BoardTaskMoveInput | null>(null)

	useEffect(() => {
		if (activeTaskId === null) {
			setPreviewColumns(columns)
		}
	}, [activeTaskId, columns])

	const renderedColumns = activeTaskId === null ? columns : previewColumns
	const activeTask = useMemo(
		() => findBoardTask(renderedColumns, activeTaskId),
		[activeTaskId, renderedColumns],
	)

	const resetDragState = () => {
		setActiveTaskId(null)
		setPreviewColumns(columns)
		latestPlacementRef.current = null
	}

	const handleDragStart = (event: DragStartEvent) => {
		if (disableInteraction) {
			return
		}

		setActiveTaskId(String(event.active.id))
		setPreviewColumns(columns)
		latestPlacementRef.current = null
	}

	const handleDragOver = (event: DragOverEvent) => {
		if (disableInteraction || activeTaskId === null) {
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
		if (disableInteraction || activeTaskId === null) {
			resetDragState()
			return
		}

		const finalPlacement =
			getDragPlacement(previewColumns, event, activeTaskId) ?? latestPlacementRef.current

		if (finalPlacement) {
			onMoveTask(finalPlacement)
		}

		resetDragState()
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCorners}
			onDragStart={handleDragStart}
			onDragOver={handleDragOver}
			onDragEnd={handleDragEnd}
			onDragCancel={resetDragState}
		>
			<div className='overflow-x-auto pb-2'>
				<div className='flex min-w-max items-start gap-3'>
					{renderedColumns.map((column) => (
						<BoardColumnView
							key={column.id}
							column={column}
							onOpenTask={onOpenTask}
							activeDragTaskId={activeTaskId}
							disabled={disableInteraction}
						/>
					))}
				</div>
			</div>

			<DragOverlay>
				{activeTask ? (
					<div className='w-[292px]'>
						<BoardCard
							task={activeTask}
							columnId={activeTask.columnId}
							onOpenTask={onOpenTask}
							isDragOverlay
						/>
					</div>
				) : null}
			</DragOverlay>
		</DndContext>
	)
}

export { Board }
