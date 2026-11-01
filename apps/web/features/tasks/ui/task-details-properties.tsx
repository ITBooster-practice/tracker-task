import type { Task, TeamMember, UpdateTask } from '@repo/types'
import {
	Avatar,
	AvatarFallback,
	cn,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@repo/ui'
import { CalendarDays } from '@repo/ui/icons'

import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '../model/form'
import { taskChoiceToneClasses, taskPriorityChoices } from './task-choice-options'
import { TaskLabels } from './task-labels'

const statusOptions = [{ value: 'BACKLOG', label: 'Бэклог' }, ...TASK_STATUS_OPTIONS]
const inlineSelectClassName =
	'-ml-2 h-9 w-[calc(100%+1rem)] min-w-0 border-transparent bg-transparent px-2 shadow-none hover:bg-muted/50 dark:border-transparent dark:bg-transparent'

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
	task,
	members,
	canEdit,
	busy,
	onUpdate,
}: {
	task: Task
	members: readonly Pick<TeamMember, 'userId' | 'name' | 'email'>[]
	canEdit: boolean
	busy: boolean
	onUpdate: (data: UpdateTask) => void
}) {
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
			<div className='space-y-2'>
				<p
					id='task-detail-status-label'
					className='text-xs leading-4 text-muted-foreground'
				>
					Статус
				</p>
				{canEdit ? (
					<Select
						value={task.status}
						disabled={busy}
						onValueChange={(status) => onUpdate({ status: status as Task['status'] })}
					>
						<SelectTrigger
							aria-labelledby='task-detail-status-label'
							className={inlineSelectClassName}
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{statusOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : (
					<p className='text-sm leading-5'>
						{statusOptions.find((option) => option.value === task.status)?.label}
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
							className={cn(inlineSelectClassName, taskChoiceToneClasses[priority.tone])}
						>
							<span className='inline-flex min-w-0 items-center gap-1.5'>
								<PriorityIcon aria-hidden className='size-4 shrink-0' />
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
