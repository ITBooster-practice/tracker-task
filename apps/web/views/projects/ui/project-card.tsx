'use client'

import type { Project } from '@repo/types'
import { cn } from '@repo/ui'
import { ArrowRight, FolderKanban } from '@repo/ui/icons'

interface Props {
	project: Project
	onOpen: (project: Project) => void
}

function ProjectCard({ project, onOpen }: Props) {
	const code = project.name.slice(0, 2).toUpperCase()

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
					{code}
				</div>
				<ArrowRight className='size-4 text-muted-foreground transition-colors group-hover:text-foreground' />
			</div>

			<div className='space-y-1.5'>
				<h3 className='text-[16px] font-semibold leading-5 tracking-tight text-card-foreground'>
					{project.name}
				</h3>

				<p className='line-clamp-2 text-[12px] leading-5 text-muted-foreground'>
					{project.description ?? (
						<span className='inline-flex items-center gap-1.5 italic'>
							<FolderKanban className='size-3' />
							Нет описания
						</span>
					)}
				</p>
			</div>
		</button>
	)
}

export { ProjectCard }
