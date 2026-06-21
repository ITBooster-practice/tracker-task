'use client'

import type { Priority, TaskStatus, TaskType } from '@repo/types'
import { cn } from '@repo/ui'
import { AlertTriangle, BookOpen, Bug, ChevronDown, CircleDot, Zap } from '@repo/ui/icons'

export const TASK_TYPE_BUTTONS: {
	value: TaskType
	label: string
	icon: React.ReactNode
}[] = [
	{
		value: 'TASK',
		label: 'Задача',
		icon: <CircleDot className='size-3.5 text-blue-400' />,
	},
	{ value: 'BUG', label: 'Баг', icon: <Bug className='size-3.5 text-rose-400' /> },
	{
		value: 'STORY',
		label: 'Стори',
		icon: <BookOpen className='size-3.5 text-emerald-400' />,
	},
	{ value: 'EPIC', label: 'Эпик', icon: <Zap className='size-3.5 text-violet-400' /> },
	{
		value: 'TECH_DEBT',
		label: 'Техдолг',
		icon: <AlertTriangle className='size-3.5 text-amber-400' />,
	},
]

export const TASK_PRIORITY_BUTTONS: {
	value: Priority
	label: string
	colorClass: string
}[] = [
	{ value: 'CRITICAL', label: 'Критический', colorClass: 'text-destructive' },
	{ value: 'HIGH', label: 'Высокий', colorClass: 'text-orange-400' },
	{ value: 'MEDIUM', label: 'Средний', colorClass: 'text-primary' },
	{ value: 'LOW', label: 'Низкий', colorClass: 'text-muted-foreground' },
]

export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
	{ value: 'BACKLOG', label: 'Backlog' },
	{ value: 'TODO', label: 'To Do' },
	{ value: 'IN_PROGRESS', label: 'In Progress' },
	{ value: 'IN_REVIEW', label: 'Review' },
	{ value: 'DONE', label: 'Done' },
]

export const formInputClass =
	'w-full rounded-[var(--radius-control)] border border-border bg-background px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export const formSelectClass =
	'w-full cursor-pointer appearance-none rounded-[var(--radius-control)] border border-border bg-background px-3 py-2.5 text-[14px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function TypeToggle({
	value,
	onChange,
}: {
	value: TaskType
	onChange: (v: TaskType) => void
}) {
	return (
		<div className='flex flex-col gap-2'>
			<label className='text-[14px] font-medium'>Тип</label>
			<div className='flex flex-wrap gap-2'>
				{TASK_TYPE_BUTTONS.map((btn) => (
					<button
						key={btn.value}
						type='button'
						onClick={() => onChange(btn.value)}
						className={cn(
							'flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-control)] border px-3 py-1.5 text-[13px] font-medium transition-colors',
							value === btn.value
								? 'border-primary text-foreground'
								: 'border-border text-muted-foreground hover:border-primary/50',
						)}
					>
						{btn.icon}
						{btn.label}
					</button>
				))}
			</div>
		</div>
	)
}

export function PriorityToggle({
	value,
	onChange,
}: {
	value: Priority
	onChange: (v: Priority) => void
}) {
	return (
		<div className='flex flex-col gap-2'>
			<label className='text-[14px] font-medium'>Приоритет</label>
			<div className='flex flex-wrap gap-2'>
				{TASK_PRIORITY_BUTTONS.map((btn) => (
					<button
						key={btn.value}
						type='button'
						onClick={() => onChange(btn.value)}
						className={cn(
							'cursor-pointer rounded-[var(--radius-control)] border px-3 py-1.5 text-[13px] font-medium transition-colors',
							btn.colorClass,
							value === btn.value
								? 'border-primary'
								: 'border-border hover:border-primary/50',
						)}
					>
						{btn.label}
					</button>
				))}
			</div>
		</div>
	)
}

export function StatusSelect({
	value,
	onChange,
}: {
	value: TaskStatus
	onChange: (v: TaskStatus) => void
}) {
	return (
		<div className='flex flex-col gap-1.5'>
			<label className='text-[14px] font-medium'>Статус</label>
			<div className='relative'>
				<select
					value={value}
					onChange={(e) => onChange(e.target.value as TaskStatus)}
					className={formSelectClass}
				>
					{TASK_STATUS_OPTIONS.map((o) => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</select>
				<ChevronDown className='pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
			</div>
		</div>
	)
}

export function AssigneeSelect({
	value,
	members,
	onChange,
}: {
	value: string
	members: { userId: string; name: string | null }[]
	onChange: (userId: string) => void
}) {
	return (
		<div className='flex flex-col gap-1.5'>
			<label className='text-[14px] font-medium'>Исполнитель</label>
			<div className='relative'>
				<select
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className={formSelectClass}
				>
					<option value=''>Не назначен</option>
					{members.map((m) => (
						<option key={m.userId} value={m.userId}>
							{m.name ?? m.userId}
						</option>
					))}
				</select>
				<ChevronDown className='pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
			</div>
		</div>
	)
}
