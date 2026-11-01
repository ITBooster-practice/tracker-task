import type { Priority, TaskStatus, TaskType } from '@repo/types'
import type { ChoiceTone } from '@repo/ui'
import {
	ArrowDown,
	ArrowUp,
	BookOpen,
	Bug,
	CircleCheck,
	CircleDashed,
	CircleDot,
	Eye,
	LoaderCircle,
	Minus,
	TriangleAlert,
	Zap,
	type LucideIcon,
} from '@repo/ui/icons'

interface TaskChoiceStyle {
	Icon: LucideIcon
	tone: ChoiceTone
}

export const taskChoiceToneClasses: Record<ChoiceTone, string> = {
	primary: 'text-primary',
	danger: 'text-destructive',
	success: 'text-choice-success',
	warning: 'text-choice-warning',
	accent: 'text-choice-accent',
	neutral: 'text-muted-foreground',
}

export const taskTypeChoices: Record<TaskType, TaskChoiceStyle> = {
	TASK: { Icon: CircleDot, tone: 'primary' },
	BUG: { Icon: Bug, tone: 'danger' },
	STORY: { Icon: BookOpen, tone: 'success' },
	EPIC: { Icon: Zap, tone: 'accent' },
	TECH_DEBT: { Icon: TriangleAlert, tone: 'warning' },
}

export const taskPriorityChoices: Record<Priority, TaskChoiceStyle> = {
	LOW: { Icon: ArrowDown, tone: 'neutral' },
	MEDIUM: { Icon: Minus, tone: 'primary' },
	HIGH: { Icon: ArrowUp, tone: 'warning' },
	CRITICAL: { Icon: TriangleAlert, tone: 'danger' },
}

export const taskStatusChoices: Record<TaskStatus, TaskChoiceStyle> = {
	BACKLOG: { Icon: CircleDashed, tone: 'neutral' },
	TODO: { Icon: CircleDashed, tone: 'neutral' },
	IN_PROGRESS: { Icon: LoaderCircle, tone: 'primary' },
	IN_REVIEW: { Icon: Eye, tone: 'accent' },
	DONE: { Icon: CircleCheck, tone: 'success' },
}
