import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

import { cn } from '@repo/ui'
import { Plus } from '@repo/ui/icons'

import { getBoardColumnContainerId } from '../model/constants'
import type { BoardColumn } from '../model/types'
import { BoardCard } from './board-card'

interface BoardColumnProps {
	column: BoardColumn
	onOpenTask: (taskId: string) => void
	onCreateTask?: () => void
	activeDragTaskId: string | null
	disabled?: boolean
}

function BoardColumn({
	column,
	onOpenTask,
	onCreateTask,
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
		<section className='flex w-[260px] shrink-0 flex-col'>
			<header className='mb-2 px-2'>
				<div className='flex items-center justify-between gap-2'>
					<div className='flex items-center gap-2'>
						<h2 className='text-[13px] font-semibold tracking-[0.01em] text-foreground'>
							{column.title}
						</h2>
						<span className='inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground'>
							{column.tasks.length}
						</span>
					</div>

					{onCreateTask && (
						<button
							type='button'
							onClick={onCreateTask}
							className='inline-flex size-5 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground'
							title='Создать задачу'
						>
							<Plus className='size-3.5' />
						</button>
					)}
				</div>
			</header>

			<div
				ref={setNodeRef}
				className={cn(
					'flex min-h-[320px] flex-1 flex-col rounded-[16px] p-2 transition-colors duration-200',
					isOver && 'bg-primary/5',
				)}
			>
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
							<div className='flex min-h-[100px] flex-1 items-center justify-center rounded-[12px] border border-dashed border-border/60 bg-background/40 px-4 text-center text-[11px] leading-5 text-muted-foreground/60'>
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
