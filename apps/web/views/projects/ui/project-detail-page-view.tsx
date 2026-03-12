'use client'

import { useTeamDetail } from '@/hooks/api/use-teams'
import { formatProjectNameFromId, getProjectById } from '@/lib/projects/catalog'
import { teamRoutes } from '@/shared/config/routes'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import { Avatar, AvatarFallback, cn } from '@repo/ui'
import {
	Activity,
	ChevronRight,
	KanbanSquare,
	Plus,
	Sparkles,
	SquareKanban,
} from '@repo/ui/icons'

import { projectPageSubtitleClassName, projectPageTitleClassName } from '../lib/styles'

const actionCards = [
	{
		id: 'create-board',
		title: 'Создать доску',
		description: 'Добавить новую kanban-доску',
		icon: SquareKanban,
		iconClassName: 'text-primary',
	},
	{
		id: 'create-task',
		title: 'Создать задачу',
		description: 'Добавить новую задачу',
		icon: Plus,
		iconClassName: 'text-emerald-400',
	},
	{
		id: 'ai-generation',
		title: 'AI генерация',
		description: 'Сгенерировать задачи из описания',
		icon: Sparkles,
		iconClassName: 'text-accent',
	},
] as const

function ProjectDetailPageView() {
	const params = useParams<{ id: string; projectId: string }>()
	const teamId = decodeURIComponent(params.id)
	const projectId = decodeURIComponent(params.projectId)
	const { data: team } = useTeamDetail(teamId)
	const project = getProjectById(projectId)
	const projectName = project?.name ?? formatProjectNameFromId(projectId)
	const projectDescription = project?.description ?? 'Новый проект команды'
	const boards = project?.boards ?? []
	const recentTasks = project?.recentTasks ?? []

	return (
		<div className='min-h-full w-full bg-background text-foreground'>
			<div className='mx-auto max-w-[960px] px-6 py-5'>
				<nav className='mb-3 flex flex-wrap items-center gap-2 text-[14px] text-muted-foreground'>
					<Link
						href={teamRoutes.projects(teamId)}
						className='transition-colors hover:text-foreground'
					>
						{team?.name ?? 'Команда'}
					</Link>
					<ChevronRight className='size-4 text-muted-foreground/70' />
					<span className='text-foreground'>{projectName}</span>
				</nav>

				<header className='mb-6'>
					<h1 className={projectPageTitleClassName}>{projectName}</h1>
					<p className={projectPageSubtitleClassName}>{projectDescription}</p>
				</header>

				<section className='mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
					{actionCards.map((card) => {
						const Icon = card.icon

						return (
							<button
								key={card.id}
								type='button'
								className='flex h-[112px] w-full flex-col rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/30'
							>
								<div className='mb-4 flex size-8 items-center justify-center rounded-md bg-primary/10'>
									<Icon className={cn('size-4', card.iconClassName)} />
								</div>
								<div className='text-[16px] font-semibold leading-5 tracking-tight'>
									{card.title}
								</div>
								<div className='mt-1 text-[12px] leading-5 text-muted-foreground'>
									{card.description}
								</div>
							</button>
						)
					})}
				</section>

				<section className='mb-7'>
					<h2 className='mb-4 text-[20px] font-semibold tracking-tight'>Доски</h2>
					<div className='grid gap-4 sm:grid-cols-2'>
						{boards.length > 0 ? (
							boards.map((board) => (
								<button
									key={board.id}
									type='button'
									className='flex h-[88px] w-full items-center gap-4 rounded-lg border border-border bg-card px-5 text-left transition-colors hover:border-primary/30'
								>
									<div className='flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary'>
										<KanbanSquare className='size-4' />
									</div>
									<div className='min-w-0'>
										<div className='truncate text-[16px] font-semibold tracking-tight'>
											{board.name}
										</div>
										<div className='mt-1 text-[12px] text-muted-foreground'>
											{board.columnCount} колонок
										</div>
									</div>
								</button>
							))
						) : (
							<div className='rounded-lg border border-dashed border-border bg-card px-5 py-8 text-[14px] text-muted-foreground sm:col-span-2'>
								Пока нет досок. Создайте первую доску для проекта.
							</div>
						)}
					</div>
				</section>

				<section>
					<div className='mb-4 flex items-center gap-2'>
						<Activity className='size-5 text-muted-foreground' />
						<h2 className='text-[20px] font-semibold tracking-tight'>Последние задачи</h2>
					</div>

					<div className='overflow-hidden rounded-[22px] border border-border bg-card shadow-[0_18px_32px_-28px_rgba(12,18,32,0.55)]'>
						{recentTasks.length > 0 ? (
							recentTasks.map((task) => (
								<div
									key={task.id}
									className='flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0'
								>
									<span className='w-14 shrink-0 text-[12px] font-medium text-muted-foreground'>
										{task.key}
									</span>
									<span className='min-w-0 flex-1 truncate text-[15px] font-medium'>
										{task.title}
									</span>
									<Avatar className='size-8 border border-border/80'>
										<AvatarFallback className='bg-surface-2 text-[11px] font-medium text-muted-foreground'>
											{task.assigneeInitials}
										</AvatarFallback>
									</Avatar>
								</div>
							))
						) : (
							<div className='px-4 py-8 text-[14px] text-muted-foreground'>
								В проекте пока нет задач.
							</div>
						)}
					</div>
				</section>
			</div>
		</div>
	)
}

export { ProjectDetailPageView }
