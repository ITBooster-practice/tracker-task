import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { Avatar, AvatarFallback, Card, CardContent, cn } from '@repo/ui'
import { CalendarDays } from '@repo/ui/icons'

import {
	taskChoiceToneClasses,
	taskPriorityChoices,
	taskTypeChoices,
} from '@/features/tasks/ui/task-choice-options'
import { TaskLabels } from '@/features/tasks/ui/task-labels'

import { BOARD_PRIORITY_LABELS, BOARD_TYPE_OPTIONS } from '../model/constants'
import type { BoardColumnId, BoardTask } from '../model/types'

interface BoardCardProps {
	task: BoardTask
	boardColumnId: BoardColumnId
	onOpenTask: (taskId: string) => void
	disabled?: boolean
	isActiveDragItem?: boolean
	isDragOverlay?: boolean
	laneKey?: string
}

const dateFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })
function BoardCardBody({
	task,
	isDragOverlay = false,
}: Pick<BoardCardProps, 'task' | 'isDragOverlay'>) {
	const TypeIcon = taskTypeChoices[task.type].Icon
	const PriorityIcon = taskPriorityChoices[task.priority].Icon
	const overdue = Boolean(
		task.dueDate &&
		new Date(task.dueDate).getTime() < Date.now() &&
		task.status !== 'DONE',
	)
	return (
		<Card
			className={cn(
				'gap-0 border-border bg-card py-0 shadow-[var(--shadow-1)] transition-[box-shadow,border-color] duration-200 hover:border-primary/40',
				isDragOverlay && 'border-primary/50 shadow-[var(--shadow-3)]',
			)}
		>
			<CardContent className='space-y-3 p-3'>
				<div className='flex min-w-0 items-center justify-between gap-2 text-xs text-muted-foreground'>
					<div className='flex min-w-0 items-center gap-1.5'>
						<TypeIcon
							aria-hidden
							className={cn(
								'size-3 shrink-0',
								taskChoiceToneClasses[taskTypeChoices[task.type].tone],
							)}
						/>
						<span className='sr-only'>
							{BOARD_TYPE_OPTIONS.find((option) => option.value === task.type)?.label}
						</span>
						<span className='truncate' title={task.key}>
							{task.key}
						</span>
					</div>
					<span
						className={cn(
							'inline-flex shrink-0 items-center gap-1',
							taskChoiceToneClasses[taskPriorityChoices[task.priority].tone],
						)}
					>
						<PriorityIcon aria-hidden className='size-3' />
						{BOARD_PRIORITY_LABELS[task.priority]}
					</span>
				</div>
				<p className='min-h-12 text-base leading-6 font-medium break-words text-foreground'>
					{task.title}
				</p>
				<TaskLabels labels={task.labels} />
				<div className='flex items-center justify-between gap-2 border-t border-border pt-2 text-xs text-muted-foreground'>
					<span
						className={cn(
							'inline-flex items-center gap-1',
							overdue && 'text-destructive',
						)}
					>
						<CalendarDays aria-hidden className='size-3 shrink-0' />
						{task.dueDate ? (
							<time dateTime={task.dueDate}>
								{dateFormatter.format(new Date(task.dueDate))}
								{overdue && ' · просрочено'}
							</time>
						) : (
							'Без срока'
						)}
					</span>
					<div className='ml-auto flex min-w-0 items-center gap-1.5'>
						<Avatar className='size-5 shrink-0'>
							<AvatarFallback className='bg-primary/10 text-xs font-normal text-primary'>
								{task.assignee?.initials ?? '—'}
							</AvatarFallback>
						</Avatar>
						<span className='max-w-28 truncate' title={task.assignee?.name}>
							{task.assignee?.name ?? 'Без исполнителя'}
						</span>
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
			<div className='absolute inset-0 rounded-[var(--radius-surface)] border border-dashed border-primary/45 bg-primary/8' />
		</div>
	)
}

function BoardCard(props: BoardCardProps) {
	if (props.isDragOverlay) {
		return (
			<div className='select-none' data-testid={`board-task-overlay-${props.task.id}`}>
				<BoardCardBody task={props.task} isDragOverlay />
			</div>
		)
	}
	return <SortableBoardCard {...props} />
}

function SortableBoardCard({
	task,
	boardColumnId,
	onOpenTask,
	disabled = false,
	isActiveDragItem = false,
	laneKey,
}: Omit<BoardCardProps, 'isDragOverlay'>) {
	const instructionsId = `board-task-instructions-${task.id}`
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
		useSortable({
			id: task.id,
			data: {
				type: 'task',
				taskId: task.id,
				boardColumnId,
				laneKey,
			},
			disabled,
		})

	const style = { transform: CSS.Transform.toString(transform), transition }

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
			id={`board-task-${task.id}`}
			style={style}
			data-testid={`board-task-${task.id}`}
			{...attributes}
			role='button'
			tabIndex={0}
			aria-label={task.title}
			aria-disabled={undefined}
			aria-describedby={disabled ? undefined : instructionsId}
			onPointerDown={(event) => {
				if (event.pointerType !== 'touch') listeners?.onPointerDown?.(event)
			}}
			onTouchStart={(event) => listeners?.onTouchStart?.(event)}
			onClick={() => onOpenTask(task.id)}
			onKeyDown={(event) => {
				if (isDragging) return
				if (event.key === 'Enter' || (disabled && event.key === ' ')) {
					event.preventDefault()
					onOpenTask(task.id)
				} else {
					listeners?.onKeyDown?.(event)
				}
			}}
			title={
				disabled
					? 'Открыть задачу'
					: 'Клик открывает задачу. Зажмите и потяните, чтобы перенести её.'
			}
			className={cn(
				'relative select-none rounded-[var(--radius-surface)] outline-none focus-visible:ring-2 focus-visible:ring-ring',
				{
					'cursor-grab active:cursor-grabbing': !disabled,
					'cursor-default': disabled,
					'opacity-85': isDragging,
				},
			)}
		>
			<span id={instructionsId} className='sr-only'>
				Enter открывает задачу. Нажмите Пробел, чтобы взять задачу. Стрелки перемещают её
				между карточками, группами и колонками. Пробел или Enter сохраняет перенос, Escape
				отменяет.
			</span>
			<BoardCardBody task={task} />
		</div>
	)
}

export { BoardCard }
