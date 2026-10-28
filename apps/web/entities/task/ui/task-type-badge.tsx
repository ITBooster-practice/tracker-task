import { Badge, cn } from '@repo/ui'

import { TaskType } from '../model/types'

const typeVariants: Record<TaskType, string> = {
	EPIC: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/20 dark:text-violet-200',
	STORY:
		'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/20 dark:text-sky-200',
	BUG: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/20 dark:text-rose-200',
	TECH_DEBT:
		'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/20 dark:text-amber-200',
	TASK: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-500/25 dark:bg-slate-500/20 dark:text-slate-300',
}

const typeLabels: Record<TaskType, string> = {
	EPIC: 'Эпик',
	STORY: 'Стори',
	BUG: 'Баг',
	TECH_DEBT: 'Тех. долг',
	TASK: 'Задача',
}

interface TaskTypeBadgeProps {
	type: TaskType
	className?: string
}

export function TaskTypeBadge({ type, className }: TaskTypeBadgeProps) {
	return (
		<Badge variant='outline' className={cn(typeVariants[type], className)}>
			{typeLabels[type]}
		</Badge>
	)
}
