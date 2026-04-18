import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

import { cn } from '@repo/ui'

import { getBoardColumnContainerId } from '../model/constants'
import type { BoardColumn } from '../model/types'
import { BoardCard } from './board-card'

interface BoardColumnProps {
	column: BoardColumn
	onOpenTask: (taskId: string) => void
	activeDragTaskId: string | null
	disabled?: boolean
}

function BoardColumn({
	column,
	onOpenTask,
	activeDragTaskId,
	disabled = false,
}: BoardColumnProps) {
	const { isOver, setNodeRef } = useDroppable({
		id: getBoardColumnContainerId(column.id),
		data: {
			type: 'column',
			columnId: column.id,
		},
		disabled,
	})

	return (
		<section
			className={cn(
				'flex w-[292px] shrink-0 flex-col rounded-[24px] border border-border/80 bg-card/72 backdrop-blur-sm transition-[background-color,border-color,box-shadow] duration-200',
				isOver &&
					'border-primary/45 bg-primary/5 shadow-[0_18px_44px_-34px_rgba(46,84,255,0.45)]',
			)}
		>
			<header className='border-b border-border/70 px-4 py-3'>
				<div className='flex items-center justify-between gap-2'>
					<div className='min-w-0'>
						<h2 className='text-[13px] font-semibold tracking-[0.01em] text-foreground'>
							{column.title}
						</h2>
					</div>

					<span className='inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-2 text-[11px] font-semibold text-muted-foreground'>
						{column.tasks.length}
					</span>
				</div>
			</header>

			<div ref={setNodeRef} className='flex min-h-[480px] flex-1 flex-col px-3 py-3'>
				<SortableContext
					items={column.tasks.map((task) => task.id)}
					strategy={verticalListSortingStrategy}
				>
					<div className='flex min-h-full flex-col gap-2'>
						{column.tasks.length > 0 ? (
							column.tasks.map((task) => (
								<BoardCard
									key={task.id}
									task={task}
									columnId={column.id}
									onOpenTask={onOpenTask}
									disabled={disabled}
									isActiveDragItem={activeDragTaskId === task.id}
								/>
							))
						) : (
							<div className='flex min-h-[148px] flex-1 items-center justify-center rounded-[18px] border border-dashed border-border bg-background/65 px-4 text-center text-[12px] leading-5 text-muted-foreground'>
								{disabled ? 'Нет задач под текущие фильтры' : 'Перетащите карточку сюда'}
							</div>
						)}
					</div>
				</SortableContext>
			</div>
		</section>
	)
}

export { BoardColumn }
