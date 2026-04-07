import { Badge, cn } from '@repo/ui'

import { TaskType } from '../model/types'

const typeVariants: Record<TaskType, string> = {
	Эпик: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/20 dark:text-violet-200',
	Стори:
		'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/20 dark:text-sky-200',
	Баг: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/20 dark:text-rose-200',
	'Тех. долг':
		'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/20 dark:text-amber-200',
	Задача:
		'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-500/25 dark:bg-slate-500/20 dark:text-slate-300',
}

interface TaskTypeBadgeProps {
	type: TaskType
	className?: string
}

export function TaskTypeBadge({ type, className }: TaskTypeBadgeProps) {
	return (
		<Badge variant='outline' className={cn(typeVariants[type], className)}>
			{type}
		</Badge>
	)
}
