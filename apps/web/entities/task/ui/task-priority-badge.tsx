import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui'
import { AlertTriangle, ArrowDown, ArrowUp, Minus } from '@repo/ui/icons'

import { TaskPriority } from '../model/types'

const priorityIcons: Record<TaskPriority, React.ReactNode> = {
	CRITICAL: <AlertTriangle className='size-3.5 text-destructive' />,
	HIGH: <ArrowUp className='size-3.5 text-warning' />,
	MEDIUM: <Minus className='size-3.5 text-primary' />,
	LOW: <ArrowDown className='size-3.5 text-muted-foreground' />,
}

const priorityLabels: Record<TaskPriority, string> = {
	LOW: 'Низкий',
	MEDIUM: 'Средний',
	HIGH: 'Высокий',
	CRITICAL: 'Критичный',
}

interface TaskPriorityBadgeProps {
	priority: TaskPriority
	className?: string
}

export function TaskPriorityBadge({ priority, className }: TaskPriorityBadgeProps) {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger className={className} asChild>
					{priorityIcons[priority]}
				</TooltipTrigger>
				<TooltipContent>
					<p>{priorityLabels[priority]}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}
