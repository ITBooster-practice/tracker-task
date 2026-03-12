'use client'

import { useTeamDetail } from '@/hooks/api/use-teams'
import { formatProjectNameFromId, getProjectById } from '@/lib/projects/catalog'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import { Button } from '@repo/ui'
import { ArrowLeft, KanbanSquare, ListTodo } from '@repo/ui/icons'

import {
	projectPageHeaderClassName,
	projectPagePrimaryButtonClassName,
	projectPageSubtitleClassName,
	projectPageTitleClassName,
} from '../lib/styles'

function ProjectDetailPageView() {
	const params = useParams<{ id: string; projectId: string }>()
	const teamId = decodeURIComponent(params.id)
	const projectId = decodeURIComponent(params.projectId)
	const { data: team } = useTeamDetail(teamId)
	const project = getProjectById(projectId)
	const projectName = project?.name ?? formatProjectNameFromId(projectId)
	const projectDescription =
		project?.description ?? 'Страница проекта находится в работе.'

	return (
		<div className='min-h-full w-full bg-background text-foreground'>
			<div className='mx-auto max-w-[960px] px-6 py-5'>
				<header className={projectPageHeaderClassName}>
					<div>
						<h1 className={projectPageTitleClassName}>{projectName}</h1>
						<p className={projectPageSubtitleClassName}>
							{team?.name ?? 'Загрузка команды'}
						</p>
					</div>

					<Button asChild className={projectPagePrimaryButtonClassName}>
						<Link href={`/teams/${encodeURIComponent(teamId)}/projects`}>
							<ArrowLeft className='mr-2 size-4' />К проектам
						</Link>
					</Button>
				</header>

				<section className='rounded-lg border border-border bg-card p-4 shadow-[0_18px_32px_-28px_rgba(12,18,32,0.55)]'>
					<div className='mb-4 flex size-10 items-center justify-center rounded-md bg-primary/10 text-[15px] font-semibold text-primary'>
						{project?.code ?? projectName.slice(0, 2).toUpperCase()}
					</div>
					<h2 className='mb-2 text-[18px] font-semibold tracking-tight'>{projectName}</h2>
					<p className='mb-4 max-w-[520px] text-[14px] leading-6 text-muted-foreground'>
						{projectDescription}
					</p>
					<div className='flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted-foreground'>
						<span className='inline-flex items-center gap-2'>
							<KanbanSquare className='size-4' />
							{project?.boardsCount ?? 0} досок
						</span>
						<span className='inline-flex items-center gap-2'>
							<ListTodo className='size-4' />
							{project?.tasksCount ?? 0} задач
						</span>
						<span className='inline-flex items-center gap-2'>ID: {projectId}</span>
					</div>
				</section>
			</div>
		</div>
	)
}

export { ProjectDetailPageView }
