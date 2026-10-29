import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useEffect, useRef, type ReactNode } from 'react'

import { Button, cn } from '@repo/ui'
import { Pencil, Plus } from '@repo/ui/icons'

import { getBoardColumnContainerId } from '../model/constants'
import type { BoardColumn } from '../model/types'
import { BoardCard } from './board-card'

interface BoardColumnProps {
	column: BoardColumn
	onOpenTask: (taskId: string) => void
	onCreateTask?: () => void
	activeDragTaskId: string | null
	disabled?: boolean
	onEditTitle?: () => void
	titleEditor?: ReactNode
	editTitleDisabled?: boolean
}

function BoardColumn({
	column,
	onOpenTask,
	onCreateTask,
	activeDragTaskId,
	disabled = false,
	onEditTitle,
	titleEditor,
	editTitleDisabled = false,
}: BoardColumnProps) {
	const editTrigger = useRef<HTMLButtonElement>(null)
	const wasEditing = useRef(false)
	const isEditingTitle = Boolean(titleEditor)
	useEffect(() => {
		if (wasEditing.current && !isEditingTitle) editTrigger.current?.focus()
		wasEditing.current = isEditingTitle
	}, [isEditingTitle])
	const { isOver, setNodeRef } = useDroppable({
		id: getBoardColumnContainerId(column.id),
		data: {
			type: 'column',
			boardColumnId: column.id,
		},
		disabled,
	})

	return (
		<section className='flex w-[260px] shrink-0 flex-col'>
			<header className='mb-2 px-2'>
				{titleEditor ?? (
					<div className='flex items-start justify-between gap-2'>
						<div className='flex min-w-0 flex-1 items-start gap-2'>
							<h2 className='min-w-0 text-lg leading-7 font-semibold break-words text-foreground'>
								{column.title}
							</h2>
							<span className='mt-1 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-semibold text-muted-foreground'>
								{column.tasks.length}
							</span>
						</div>
						{onEditTitle && (
							<Button
								ref={editTrigger}
								type='button'
								variant='ghost'
								size='icon-sm'
								disabled={editTitleDisabled}
								onClick={onEditTitle}
								aria-label={`Переименовать колонку «${column.title}»`}
							>
								<Pencil aria-hidden='true' />
							</Button>
						)}

						{onCreateTask && (
							<Button
								type='button'
								onClick={onCreateTask}
								variant='ghost'
								size='icon-sm'
								aria-label='Создать задачу'
							>
								<Plus aria-hidden='true' />
							</Button>
						)}
					</div>
				)}
			</header>

			<div
				ref={setNodeRef}
				className={cn(
					'flex min-h-[320px] flex-1 flex-col rounded-[var(--radius-surface)] p-2 transition-colors duration-200',
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
									boardColumnId={column.id}
									onOpenTask={onOpenTask}
									disabled={disabled}
									isActiveDragItem={activeDragTaskId === task.id}
								/>
							))
						) : (
							<div className='flex min-h-[100px] flex-1 items-center justify-center rounded-[var(--radius-surface)] border border-dashed border-border bg-background/40 px-4 text-center text-sm leading-5 text-muted-foreground'>
								{disabled ? 'Нет задач' : 'Перетащите карточку сюда'}
							</div>
						)}
					</div>
				</SortableContext>
			</div>
		</section>
	)
}

export { BoardColumn }
