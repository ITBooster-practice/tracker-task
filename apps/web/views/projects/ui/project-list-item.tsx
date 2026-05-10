'use client'

import type { Project } from '@repo/types'
import { cn } from '@repo/ui'
import { ChevronRight, FolderKanban } from '@repo/ui/icons'

interface Props {
	project: Project
	onOpen: (project: Project) => void
}

function ProjectListItem({ project, onOpen }: Props) {
	const code = project.name.slice(0, 2).toUpperCase()

	return (
		<button
			type='button'
			onClick={() => onOpen(project)}
			className={cn(
				'group flex w-full cursor-pointer items-center gap-4 rounded-[var(--radius-surface)] border border-border bg-card px-5 py-4 text-left transition-colors',
				'hover:border-primary/30',
				'focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
			)}
		>
			<div className='flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[14px] font-semibold text-primary'>
				{code}
			</div>

			<div className='min-w-0 flex-1'>
				<div className='text-[15px] font-semibold leading-tight text-card-foreground'>
					{project.name}
				</div>
				<div className='mt-1 line-clamp-1 text-[13px] text-muted-foreground'>
					{project.description ?? (
						<span className='inline-flex items-center gap-1 italic'>
							<FolderKanban className='size-3' />
							Нет описания
						</span>
					)}
				</div>
			</div>

			<ChevronRight className='size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground' />
		</button>
	)
}

export { ProjectListItem }
