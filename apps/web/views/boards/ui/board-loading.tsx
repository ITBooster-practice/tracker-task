'use client'

import type { BoardColumn } from '@repo/types'
import { CardSkeleton, cn, Skeleton } from '@repo/ui'
import { MoreHorizontal, Plus } from '@repo/ui/icons'

import { columnColors } from '../model/column-colors'
import { projectBoardAssigneeOptions } from '../model/project-board-filters'
import type { BoardAssignee } from '../model/types'
import { useProjectBoardFilters } from '../model/use-project-board-filters'
import { BoardToolbar } from './board-toolbar'

const boneClassName = 'rounded-sm bg-muted motion-reduce:animate-none'

function BoardTaskSkeleton() {
	return (
		<CardSkeleton className='h-[150px] justify-start gap-2.5 rounded-[var(--radius-control)] p-3.5 shadow-none'>
			<div className='flex items-center gap-2'>
				<Skeleton className={cn(boneClassName, 'size-3')} />
				<Skeleton className={cn(boneClassName, 'h-2.5 w-12')} />
			</div>
			<Skeleton className={cn(boneClassName, 'h-3 w-full')} />
			<Skeleton className={cn(boneClassName, 'h-3 w-[190px] max-w-full')} />
			<Skeleton className={cn(boneClassName, 'h-3.5 w-14')} />
			<div className='mt-auto flex h-[22px] items-center justify-between'>
				<Skeleton className={cn(boneClassName, 'h-2.5 w-[52px]')} />
				<Skeleton className={cn(boneClassName, 'size-[22px] rounded-full')} />
			</div>
		</CardSkeleton>
	)
}

export function BoardLoading({
	columns,
	currentUserId,
	assignees,
	assigneesPending,
	assigneesError,
	onRetryAssignees,
}: {
	columns?: readonly Pick<BoardColumn, 'id' | 'title' | 'color'>[]
	currentUserId?: string
	assignees: readonly Pick<BoardAssignee, 'id' | 'name'>[]
	assigneesPending: boolean
	assigneesError: boolean
	onRetryAssignees: () => void
}) {
	const { filters, grouping, update, reset, setGrouping } = useProjectBoardFilters()
	const placeholders =
		columns ??
		['gray', 'blue', 'yellow', 'violet', 'green'].map((color, index) => ({
			id: `loading-column-${index}`,
			title: '',
			color: color as BoardColumn['color'],
		}))
	return (
		<>
			<BoardToolbar
				grouping={grouping}
				onGroupingChange={setGrouping}
				filters={filters}
				onChange={update}
				onReset={reset}
				currentUserId={currentUserId}
				assigneeOptions={projectBoardAssigneeOptions([], assignees, filters.assignee)}
				assigneesPending={assigneesPending}
				assigneesError={assigneesError}
				onRetryAssignees={onRetryAssignees}
				resultText='Загружаем задачи…'
			/>
			<div
				role='status'
				aria-label='Загрузка доски'
				aria-busy='true'
				className='min-h-0 flex-1 overflow-x-auto pb-3'
			>
				<div className='flex min-w-max items-start gap-3 xl:gap-4'>
					{placeholders.map((column, index) => (
						<div
							key={column.id}
							className='w-[310px] shrink-0 space-y-3 sm:w-[300px] xl:w-[330px]'
						>
							<div
								className={cn(
									'flex h-11 items-center gap-2 border-b-2',
									columnColors[column.color].borderClassName,
								)}
							>
								<span
									aria-hidden
									className={cn(
										'size-2 shrink-0 rounded-full',
										columnColors[column.color].className,
									)}
								/>
								{column.title ? (
									<h2 className='min-w-0 truncate text-base font-semibold'>
										{column.title}
									</h2>
								) : (
									<Skeleton aria-hidden className={cn(boneClassName, 'h-4 w-28')} />
								)}
								<span aria-hidden className='text-xs text-muted-foreground'>
									—
								</span>
								<div
									aria-hidden
									className='ml-auto flex items-center gap-3 pr-2 text-muted-foreground'
								>
									<Plus className='size-4' />
									<MoreHorizontal className='size-4' />
								</div>
							</div>
							<div aria-hidden className='space-y-3'>
								{Array.from({ length: index < 3 ? 3 : 2 }, (_, cardIndex) => (
									<BoardTaskSkeleton key={cardIndex} />
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</>
	)
}
