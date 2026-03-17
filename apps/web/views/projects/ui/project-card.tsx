'use client'

import { cn } from '@repo/ui'
import { ArrowRight, KanbanSquare, ListTodo } from '@repo/ui/icons'

import type { ProjectCatalogItem } from '@/shared/lib/projects'

interface Props {
	project: ProjectCatalogItem
	onOpen: (project: ProjectCatalogItem) => void
}

function ProjectCard({ project, onOpen }: Props) {
	return (
		<button
			type='button'
			onClick={() => onOpen(project)}
			className={cn(
				'group flex h-[184px] w-full cursor-pointer flex-col justify-center gap-4 rounded-[var(--radius-surface)] border border-border bg-card p-5 text-left transition-colors',
				'hover:border-primary/30',
				'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-[3px]',
			)}
		>
			<div className='flex items-start justify-between'>
				<div className='flex size-8 items-center justify-center rounded-[calc(var(--radius-control)-2px)] bg-primary/10 text-[15px] font-semibold text-primary'>
					{project.code}
				</div>
				<ArrowRight className='size-4 text-muted-foreground transition-colors group-hover:text-foreground' />
			</div>

			<div className='space-y-1.5'>
				<h3 className='text-[16px] font-semibold leading-5 tracking-tight text-card-foreground'>
					{project.name}
				</h3>

				<p className='line-clamp-2 text-[12px] leading-5 text-muted-foreground'>
					{project.description}
				</p>
			</div>

			<div className='flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] leading-4 text-muted-foreground'>
				<span className='inline-flex items-center gap-2'>
					<KanbanSquare className='size-[13px]' />
					{project.boardsCount} досок
				</span>
				<span className='inline-flex items-center gap-2'>
					<ListTodo className='size-[13px]' />
					{project.tasksCount} задач
				</span>
			</div>
		</button>
	)
}

export { ProjectCard }
