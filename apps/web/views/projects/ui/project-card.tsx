'use client'

import type { ProjectCatalogItem } from '@/lib/projects/catalog'

import { cn } from '@repo/ui'
import { ArrowRight, KanbanSquare, ListTodo } from '@repo/ui/icons'

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
				'group flex h-[184px] w-full cursor-pointer flex-col rounded-lg border border-border bg-card p-4 text-left transition-colors',
				'hover:border-primary/30',
				'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-[3px]',
			)}
		>
			<div className='mb-4 flex items-start justify-between'>
				<div className='flex size-8 items-center justify-center rounded-md bg-primary/10 text-[15px] font-semibold text-primary'>
					{project.code}
				</div>
				<ArrowRight className='size-4 text-muted-foreground transition-colors group-hover:text-foreground' />
			</div>

			<h3 className='mb-1.5 text-[16px] font-semibold leading-5 tracking-tight text-card-foreground'>
				{project.name}
			</h3>

			<p className='line-clamp-2 text-[12px] leading-5 text-muted-foreground'>
				{project.description}
			</p>

			<div className='mt-auto flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] leading-4 text-muted-foreground'>
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
