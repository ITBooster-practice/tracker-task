import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

import { cn } from '@repo/ui'

import { boardCellId, type BoardLane } from '../model/board-swimlanes'
import { getBoardColumnContainerId } from '../model/constants'
import type { BoardColumn } from '../model/types'
import { BoardCard } from './board-card'

interface BoardColumnTasksProps {
	column: BoardColumn
	onOpenTask: (id: string) => void
	activeDragTaskId: string | null
	disabled?: boolean
	lane?: BoardLane
	dropDisabled?: boolean
}

export function BoardColumnTasks({
	column,
	onOpenTask,
	activeDragTaskId,
	disabled = false,
	lane,
	dropDisabled = false,
}: BoardColumnTasksProps) {
	const { isOver, setNodeRef } = useDroppable({
		id: lane ? boardCellId(lane, column.id) : getBoardColumnContainerId(column.id),
		data: { type: 'column', boardColumnId: column.id, laneKey: lane?.key },
		disabled: disabled || dropDisabled,
	})
	return (
		<div
			ref={setNodeRef}
			role={lane ? 'group' : undefined}
			aria-label={lane ? `${lane.label}: ${column.title}` : undefined}
			className={cn(
				'flex flex-1 flex-col rounded-[var(--radius-surface)] p-2 transition-colors duration-200',
				lane ? 'min-h-[112px]' : 'min-h-[320px]',
				isOver && 'bg-primary/5',
			)}
		>
			<SortableContext
				items={column.tasks.map((task) => task.id)}
				strategy={verticalListSortingStrategy}
			>
				<div className='flex min-h-full flex-col gap-2'>
					{column.tasks.length ? (
						column.tasks.map((task) => (
							<BoardCard
								key={task.id}
								task={task}
								boardColumnId={column.id}
								laneKey={lane?.key}
								onOpenTask={onOpenTask}
								disabled={disabled}
								isActiveDragItem={activeDragTaskId === task.id}
							/>
						))
					) : (
						<div className='flex min-h-[100px] flex-1 items-center justify-center rounded-[var(--radius-surface)] border border-dashed border-border bg-background/40 px-4 text-center text-sm leading-5 text-muted-foreground'>
							{disabled || dropDisabled ? 'Нет задач' : 'Перетащите карточку сюда'}
						</div>
					)}
				</div>
			</SortableContext>
		</div>
	)
}
