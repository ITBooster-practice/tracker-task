import { useRef } from 'react'

import {
	Button,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@repo/ui'
import { MoreHorizontal, Plus, Settings2 } from '@repo/ui/icons'

import { columnColors } from '../model/column-colors'
import { formatBoardTaskCount } from '../model/task-count'
import type { BoardColumn, PendingBoardTask } from '../model/types'
import { BoardColumnTasks } from './board-column-tasks'

interface BoardColumnProps {
	headerOnly?: boolean
	stretch?: boolean
	column: BoardColumn
	onOpenTask: (taskId: string) => void
	onCreateTask?: () => void
	activeDragTaskId: string | null
	disabled?: boolean
	onConfigure?: () => void
	actionsDisabled?: boolean
	totalTasks?: number
	pendingTasks?: PendingBoardTask[]
}

function BoardColumn({
	column,
	onOpenTask,
	onCreateTask,
	activeDragTaskId,
	disabled = false,
	onConfigure,
	actionsDisabled = false,
	headerOnly = false,
	stretch = false,
	totalTasks = column.tasks.length,
	pendingTasks = [],
}: BoardColumnProps) {
	const openingEditor = useRef(false)
	const configure = () => {
		openingEditor.current = true
		onConfigure?.()
	}
	const context = `${column.title} · ${column.tasks.length === totalTasks ? formatBoardTaskCount(totalTasks) : `${column.tasks.length} из ${formatBoardTaskCount(totalTasks, 'genitive')}`}`
	return (
		<section
			className={cn(
				'flex shrink-0 flex-col',
				stretch
					? 'min-w-[310px] flex-1 sm:min-w-[300px]'
					: 'w-[310px] sm:w-[300px] xl:w-[330px]',
			)}
		>
			<header
				className={cn(
					'mb-3 flex h-11 items-center gap-2 border-b-2',
					columnColors[column.color]?.borderClassName ??
						columnColors.gray.borderClassName,
				)}
			>
				<span
					aria-hidden
					className={cn(
						'size-2 shrink-0 rounded-full',
						columnColors[column.color]?.className ?? columnColors.gray.className,
					)}
				/>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<h2
								className='min-w-0 truncate text-base font-semibold text-foreground'
								tabIndex={0}
							>
								{column.title}
							</h2>
						</TooltipTrigger>
						<TooltipContent>{column.title}</TooltipContent>
					</Tooltip>
				</TooltipProvider>
				<span className='shrink-0 text-xs text-muted-foreground'>
					{column.tasks.length}
					{pendingTasks.length > 0 && (
						<span className='text-primary'> + {pendingTasks.length}</span>
					)}
				</span>
				<div className='ml-auto flex shrink-0 items-center gap-1'>
					{onCreateTask && (
						<Button
							type='button'
							onClick={onCreateTask}
							disabled={disabled}
							variant='ghost'
							size='icon-sm'
							aria-label={`Создать задачу в колонке «${column.title}»`}
						>
							<Plus aria-hidden />
						</Button>
					)}
					{onConfigure && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									id={`board-column-menu-${column.id}`}
									type='button'
									variant='ghost'
									size='icon-sm'
									disabled={actionsDisabled}
									aria-label={`Меню колонки «${column.title}»`}
								>
									<MoreHorizontal aria-hidden />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align='end'
								className='w-70 max-w-[calc(100vw-2rem)] space-y-0.5 rounded-[var(--radius-control)] p-1.5'
								onCloseAutoFocus={(event) => {
									if (openingEditor.current) event.preventDefault()
									openingEditor.current = false
								}}
							>
								<DropdownMenuLabel
									className='truncate px-3 py-2 text-xs font-normal text-muted-foreground'
									title={context}
								>
									{context}
								</DropdownMenuLabel>
								<DropdownMenuItem className='px-3 py-3 font-normal' onSelect={configure}>
									<Settings2 aria-hidden />
									Настроить колонку
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</header>
			{!headerOnly && (
				<BoardColumnTasks
					column={column}
					pendingTasks={pendingTasks}
					onOpenTask={onOpenTask}
					activeDragTaskId={activeDragTaskId}
					disabled={disabled}
				/>
			)}
		</section>
	)
}

export { BoardColumn }
