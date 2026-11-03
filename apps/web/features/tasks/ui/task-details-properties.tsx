import type { Task, TeamMember, UpdateTask } from '@repo/types'
import {
	Avatar,
	AvatarFallback,
	Button,
	cn,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@repo/ui'
import { CalendarDays } from '@repo/ui/icons'

import { TASK_PRIORITY_OPTIONS, TASK_TYPE_OPTIONS } from '../model/form'
import { useTaskBoardColumns } from '../model/use-task-board-columns'
import {
	taskChoiceToneClasses,
	taskPriorityChoices,
	taskTypeChoices,
} from './task-choice-options'
import { TaskLabels } from './task-labels'

const inlineSelectClassName = 'min-w-0 px-2.5 shadow-none data-[size=default]:h-9'
const coloredSelectClassName =
	'border-current bg-current/5 hover:bg-current/10 dark:border-current dark:bg-current/5 dark:hover:bg-current/10'

function TaskDate({ value }: { value: string | null }) {
	if (!value) return <>Не указан</>
	return (
		<time dateTime={value}>
			{new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeZone: 'UTC' }).format(
				new Date(value),
			)}
		</time>
	)
}

export function TaskDetailsProperties({
	teamId,
	projectId,
	task,
	members,
	canEdit,
	busy,
	onUpdate,
}: {
	teamId: string
	projectId: string
	task: Task
	members: readonly Pick<TeamMember, 'userId' | 'name' | 'email'>[]
	canEdit: boolean
	busy: boolean
	onUpdate: (data: UpdateTask) => void
}) {
	const columns = useTaskBoardColumns(teamId, projectId, task.boardColumnId)
	const column = columns.columns.find((item) => item.id === task.boardColumnId)
	const type = taskTypeChoices[task.type]
	const TypeIcon = type.Icon
	const assignee = members.find((member) => member.userId === task.assigneeId)
	const assigneeName = task.assigneeId
		? assignee?.name || assignee?.email || 'Назначенный участник'
		: 'Без исполнителя'
	const initials = task.assigneeId
		? assigneeName
				.split(/\s+/)
				.slice(0, 2)
				.map((part) => part[0])
				.join('')
				.toUpperCase()
		: '—'
	const priority = taskPriorityChoices[task.priority]
	const PriorityIcon = priority.Icon
	return (
		<aside
			aria-label='Свойства задачи'
			className='min-w-0 space-y-5 border-t border-border pt-6 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-6'
		>
			{canEdit && (
				<p className='text-xs leading-4 text-muted-foreground'>
					Тип, приоритет и колонка сохраняются сразу.
				</p>
			)}
			<div className='space-y-2'>
				<p
					id='task-detail-type-label'
					className='text-xs leading-4 text-muted-foreground'
				>
					Тип задачи
				</p>
				{canEdit ? (
					<Select
						value={task.type}
						disabled={busy}
						onValueChange={(value) => onUpdate({ type: value as Task['type'] })}
					>
						<SelectTrigger
							aria-labelledby='task-detail-type-label'
							className={cn(
								inlineSelectClassName,
								coloredSelectClassName,
								taskChoiceToneClasses[type.tone],
							)}
						>
							<span className='inline-flex min-w-0 items-center gap-1.5'>
								<TypeIcon aria-hidden className='size-4 shrink-0 text-current' />
								<SelectValue />
							</span>
						</SelectTrigger>
						<SelectContent>
							{TASK_TYPE_OPTIONS.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : (
					<p
						className={cn(
							'flex items-center gap-1.5 text-sm leading-5',
							taskChoiceToneClasses[type.tone],
						)}
					>
						<TypeIcon aria-hidden className='size-4 shrink-0' />
						{TASK_TYPE_OPTIONS.find((option) => option.value === task.type)?.label}
					</p>
				)}
			</div>
			<div className='space-y-2'>
				<p
					id='task-detail-priority-label'
					className='text-xs leading-4 text-muted-foreground'
				>
					Приоритет
				</p>
				{canEdit ? (
					<Select
						value={task.priority}
						disabled={busy}
						onValueChange={(value) => onUpdate({ priority: value as Task['priority'] })}
					>
						<SelectTrigger
							aria-labelledby='task-detail-priority-label'
							className={cn(
								inlineSelectClassName,
								coloredSelectClassName,
								taskChoiceToneClasses[priority.tone],
							)}
						>
							<span className='inline-flex min-w-0 items-center gap-1.5'>
								<PriorityIcon aria-hidden className='size-4 shrink-0 text-current' />
								<SelectValue />
							</span>
						</SelectTrigger>
						<SelectContent>
							{TASK_PRIORITY_OPTIONS.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : (
					<p
						className={cn(
							'flex items-center gap-1.5 text-sm leading-5',
							taskChoiceToneClasses[priority.tone],
						)}
					>
						<PriorityIcon aria-hidden className='size-4 shrink-0' />
						{
							TASK_PRIORITY_OPTIONS.find((option) => option.value === task.priority)
								?.label
						}
					</p>
				)}
			</div>
			<div className='space-y-2'>
				<p className='text-xs leading-4 text-muted-foreground'>Исполнитель</p>
				<div className='flex min-w-0 items-center gap-2'>
					<Avatar className='size-6 shrink-0'>
						<AvatarFallback className='bg-primary/10 text-xs font-normal text-primary'>
							{initials}
						</AvatarFallback>
					</Avatar>
					<p className='min-w-0 text-sm leading-5 break-words'>{assigneeName}</p>
				</div>
			</div>
			<div className='space-y-2'>
				<p className='text-xs leading-4 text-muted-foreground'>Срок</p>
				<p className='flex items-center gap-1.5 text-sm leading-5 text-muted-foreground'>
					<CalendarDays aria-hidden className='size-4 shrink-0' />
					<TaskDate value={task.dueDate} />
				</p>
			</div>
			<div className='space-y-2'>
				<p
					id='task-detail-column-label'
					className='text-xs leading-4 text-muted-foreground'
				>
					Колонка
				</p>
				{canEdit ? (
					<Select
						value={task.boardColumnId}
						disabled={busy || columns.isPending || Boolean(columns.error)}
						onValueChange={(boardColumnId) => onUpdate({ boardColumnId })}
					>
						<SelectTrigger
							aria-labelledby='task-detail-column-label'
							aria-describedby={columns.error ? 'task-detail-column-error' : undefined}
							className={cn(
								inlineSelectClassName,
								'border-board-gray bg-board-gray/5 hover:bg-board-gray/10 dark:border-board-gray dark:bg-board-gray/5 dark:hover:bg-board-gray/10',
							)}
						>
							<SelectValue>
								{column?.title ??
									(columns.isPending ? 'Загрузка…' : 'Колонка недоступна')}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							{columns.columns.map((item) => (
								<SelectItem key={item.id} value={item.id}>
									{item.title}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : (
					<p className='text-sm leading-5'>
						{column?.title ?? (columns.isPending ? 'Загрузка…' : 'Колонка недоступна')}
					</p>
				)}
				{columns.error && (
					<div className='space-y-2'>
						<p
							id='task-detail-column-error'
							role='alert'
							className='text-xs text-destructive'
						>
							{columns.error}
						</p>
						<Button
							type='button'
							variant='outline'
							size='sm'
							disabled={busy}
							onClick={() => {
								void columns.refetch()
							}}
						>
							Обновить колонки
						</Button>
					</div>
				)}
			</div>
			<div className='space-y-2'>
				<p className='text-xs leading-4 text-muted-foreground'>Метки</p>
				{task.labels.length ? (
					<TaskLabels
						labels={task.labels}
						className='dark:[&_[data-slot=badge]]:bg-card'
					/>
				) : (
					<p className='text-sm leading-5 text-muted-foreground'>Нет меток</p>
				)}
			</div>
			<dl className='space-y-3 border-t border-border pt-4 text-xs leading-4'>
				<div className='space-y-1'>
					<dt className='text-muted-foreground'>Создана</dt>
					<dd>
						<TaskDate value={task.createdAt} />
					</dd>
				</div>
				<div className='space-y-1'>
					<dt className='text-muted-foreground'>Обновлена</dt>
					<dd>
						<TaskDate value={task.updatedAt} />
					</dd>
				</div>
			</dl>
		</aside>
	)
}
