import { Badge, cn } from '@repo/ui'

import { TaskStatus } from '../model/types'

const statusLabels: Record<TaskStatus, string> = {
	TODO: 'К выполнению',
	IN_PROGRESS: 'В работе',
	IN_REVIEW: 'Ревью',
	DONE: 'Готово',
}

interface TaskStatusBadgeProps {
	status: TaskStatus
	className?: string
}

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
	return (
		<Badge variant='ghost' className={cn(className)}>
			{statusLabels[status]}
		</Badge>
	)
}
