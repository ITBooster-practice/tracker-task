import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { Avatar, AvatarFallback, Card, CardContent, cn } from '@repo/ui'
import { GripVertical, MessageSquare, SquareCheckBig } from '@repo/ui/icons'

import { TaskPriorityBadge, TaskTypeBadge } from '@/entities/task'

import { BOARD_PRIORITY_LABELS } from '../model/constants'
import type { BoardColumnId, BoardTask } from '../model/types'

interface BoardCardProps {
	task: BoardTask
	columnId: BoardColumnId
	onOpenTask: (taskId: string) => void
	disabled?: boolean
	isActiveDragItem?: boolean
	isDragOverlay?: boolean
}

function BoardCardBody({
	task,
	isDragOverlay = false,
}: Pick<BoardCardProps, 'task' | 'isDragOverlay'>) {
	return (
		<Card
			className={cn(
				'gap-0 rounded-[calc(var(--radius-surface)-4px)] border-border/80 bg-card py-0 shadow-[0_14px_32px_-28px_rgba(12,18,32,0.78)] transition-[box-shadow,border-color,transform] duration-200',
				isDragOverlay &&
					'border-primary/30 shadow-[0_24px_56px_-28px_rgba(46,84,255,0.55)]',
			)}
		>
			<CardContent className='space-y-3 px-3 py-3'>
				<div className='flex items-start justify-between gap-2'>
					<div className='flex min-w-0 items-center gap-2'>
						<TaskTypeBadge
							type={task.type}
							className='h-5 rounded-full px-2 text-[10px] font-semibold'
						/>
						<span className='text-[11px] font-medium tracking-[0.02em] text-muted-foreground'>
							{task.key}
						</span>
					</div>

					<span className='inline-flex size-6 shrink-0 items-center justify-center rounded-[calc(var(--radius-control)-4px)] text-muted-foreground/80'>
						<GripVertical className='size-3.5' />
					</span>
				</div>

				<p className='text-[14px] font-medium leading-5 text-foreground'>{task.title}</p>

				<div className='flex items-center gap-3 text-[11px] text-muted-foreground'>
					<div className='inline-flex items-center gap-1.5'>
						<TaskPriorityBadge priority={task.priority} />
						<span>{BOARD_PRIORITY_LABELS[task.priority]}</span>
					</div>

					{task.checklist ? (
						<div className='inline-flex items-center gap-1.5'>
							<SquareCheckBig className='size-3.5' />
							<span>
								{task.checklist.completed}/{task.checklist.total}
							</span>
						</div>
					) : null}

					{task.comments.length > 0 ? (
						<div className='inline-flex items-center gap-1.5'>
							<MessageSquare className='size-3.5' />
							<span>{task.comments.length}</span>
						</div>
					) : null}
				</div>

				<div className='flex items-center justify-between gap-3'>
					<div className='flex min-w-0 flex-wrap gap-1.5'>
						{task.tags.map((tag) => (
							<span
								key={tag}
								className='rounded-full border border-border/80 bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground'
							>
								{tag}
							</span>
						))}
					</div>

					<div className='flex shrink-0 items-center gap-2'>
						<Avatar className='size-7 border border-border/80'>
							<AvatarFallback className='bg-primary/10 text-[10px] font-semibold text-primary'>
								{task.assignee.initials}
							</AvatarFallback>
						</Avatar>
						<div className='hidden text-right md:block'>
							<div className='text-[11px] font-medium leading-none text-foreground'>
								{task.assignee.name}
							</div>
							<div className='mt-1 text-[10px] leading-none text-muted-foreground'>
								Исполнитель
							</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

function BoardCardPlaceholder({ task }: Pick<BoardCardProps, 'task'>) {
	return (
		<div className='relative'>
			<div className='pointer-events-none opacity-0'>
				<BoardCardBody task={task} />
			</div>
			<div className='absolute inset-0 rounded-[calc(var(--radius-surface)-4px)] border border-dashed border-primary/45 bg-primary/8 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]' />
		</div>
	)
}

function BoardCard({
	task,
	columnId,
	onOpenTask,
	disabled = false,
	isActiveDragItem = false,
	isDragOverlay = false,
}: BoardCardProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
		useSortable({
			id: task.id,
			data: {
				type: 'task',
				taskId: task.id,
				columnId,
			},
			disabled: disabled || isDragOverlay,
		})

	const style = isDragOverlay
		? undefined
		: {
				transform: CSS.Transform.toString(transform),
				transition,
			}

	if (isActiveDragItem) {
		return (
			<div ref={setNodeRef} style={style} data-testid={`board-task-${task.id}`}>
				<BoardCardPlaceholder task={task} />
			</div>
		)
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			data-testid={`board-task-${task.id}`}
			onClick={() => onOpenTask(task.id)}
			onKeyDown={(event) => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault()
					onOpenTask(task.id)
				}
			}}
			title='Клик открывает задачу. Зажмите и потяните, чтобы перенести её.'
			{...attributes}
			{...listeners}
			className={cn('select-none outline-none', {
				'cursor-grab active:cursor-grabbing': !disabled,
				'cursor-default': disabled,
				'opacity-85': isDragging,
			})}
		>
			<BoardCardBody task={task} isDragOverlay={isDragOverlay} />
		</div>
	)
}

export { BoardCard }
