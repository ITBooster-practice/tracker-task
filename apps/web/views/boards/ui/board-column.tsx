import { useEffect, useRef, type ReactNode } from 'react'

import { Button } from '@repo/ui'
import { Pencil, Plus, Trash2 } from '@repo/ui/icons'

import type { BoardColumn } from '../model/types'
import { BoardColumnTasks } from './board-column-tasks'

interface BoardColumnProps {
	headerOnly?: boolean
	column: BoardColumn
	onOpenTask: (taskId: string) => void
	onCreateTask?: () => void
	activeDragTaskId: string | null
	disabled?: boolean
	onEditTitle?: () => void
	titleEditor?: ReactNode
	editTitleDisabled?: boolean
	dragHandle?: ReactNode
	onDelete?: () => void
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
	dragHandle,
	onDelete,
	headerOnly = false,
}: BoardColumnProps) {
	const editTrigger = useRef<HTMLButtonElement>(null)
	const wasEditing = useRef(false)
	const isEditingTitle = Boolean(titleEditor)
	useEffect(() => {
		if (wasEditing.current && !isEditingTitle) editTrigger.current?.focus()
		wasEditing.current = isEditingTitle
	}, [isEditingTitle])

	return (
		<section className='flex w-[260px] shrink-0 flex-col'>
			<header className='mb-2 px-2'>
				{titleEditor ?? (
					<div className='flex items-start justify-between gap-2'>
						{dragHandle}
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
						{onDelete && !column.isSystem && (
							<Button
								type='button'
								variant='ghost'
								size='icon-sm'
								disabled={editTitleDisabled}
								onClick={onDelete}
								aria-label={`Удалить колонку «${column.title}»`}
							>
								<Trash2 aria-hidden='true' />
							</Button>
						)}
					</div>
				)}
			</header>

			{!headerOnly && (
				<BoardColumnTasks
					column={column}
					onOpenTask={onOpenTask}
					activeDragTaskId={activeDragTaskId}
					disabled={disabled}
				/>
			)}
		</section>
	)
}

export { BoardColumn }
