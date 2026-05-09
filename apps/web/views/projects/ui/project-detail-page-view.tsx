'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'

import {
	Avatar,
	AvatarFallback,
	Button,
	cn,
	ConfirmDialog,
	EmptyState,
	Skeleton,
	toast,
} from '@repo/ui'
import {
	Activity,
	ChevronRight,
	FolderKanban,
	KanbanSquare,
	Pencil,
	Plus,
	Sparkles,
	SquareKanban,
	Trash2,
} from '@repo/ui/icons'

import { useDeleteProject, useProjectDetail } from '@/shared/api/use-projects'
import { useTeamName } from '@/shared/api/use-teams'
import { teamRoutes } from '@/shared/config'
import { isApiError } from '@/shared/lib/api/utils'

import { projectPageSubtitleClassName, projectPageTitleClassName } from '../lib/styles'
import { EditProjectDialog } from './edit-project-dialog'

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
	const router = useRouter()
	const params = useParams<{ id: string; projectId: string }>()
	const teamId = decodeURIComponent(params.id)
	const projectId = decodeURIComponent(params.projectId)
	const teamName = useTeamName(teamId)
	const {
		data: project,
		isLoading,
		isError,
		refetch,
	} = useProjectDetail(teamId, projectId)
	const { mutateAsync: deleteProject, isPending: isDeleting } = useDeleteProject()

	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

	const boards: { id: string; name: string; columnCount: number }[] = []
	const recentTasks: {
		id: string
		key: string
		title: string
		assigneeInitials: string
	}[] = []

	const handleDelete = async () => {
		try {
			await deleteProject({ teamId, projectId })
			router.push(teamRoutes.projects(teamId))
		} catch (error) {
			if (isApiError(error)) {
				toast.error(error.message)
				return
			}
			throw error
		}
	}

	if (isLoading) {
		return (
			<div className='min-h-full w-full bg-background text-foreground'>
				<div className='mx-auto max-w-[960px] px-6 py-5'>
					<Skeleton className='mb-3 h-4 w-48' />
					<div className='mb-6'>
						<Skeleton className='mb-2 h-9 w-64' />
						<Skeleton className='h-4 w-96' />
					</div>
					<div className='mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
						{Array.from({ length: 3 }).map((_, i) => (
							<Skeleton key={i} className='h-[112px] rounded-[var(--radius-surface)]' />
						))}
					</div>
					<Skeleton className='mb-4 h-6 w-24' />
					<Skeleton className='h-[88px] rounded-[var(--radius-surface)]' />
				</div>
			</div>
		)
	}

	if (isError || !project) {
		return (
			<div className='flex min-h-full w-full items-center justify-center bg-background'>
				<EmptyState
					icon={<FolderKanban className='size-7' />}
					title='Не удалось загрузить проект'
					description='Попробуйте повторить запрос ещё раз.'
					action={
						<Button
							onClick={() => void refetch()}
							className='h-9 rounded-[var(--radius-control)] bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90'
						>
							Повторить
						</Button>
					}
					className='max-w-[420px] border-border bg-card'
				/>
			</div>
		)
	}

	return (
		<div className='min-h-full w-full bg-background text-foreground'>
			<div className='mx-auto max-w-[960px] px-6 py-5'>
				<nav className='mb-3 flex flex-wrap items-center gap-2 text-[14px] text-muted-foreground'>
					<Link
						href={teamRoutes.projects(teamId)}
						className='transition-colors hover:text-foreground'
					>
						{teamName ?? 'Команда'}
					</Link>
					<ChevronRight className='size-4 text-muted-foreground/70' />
					<span className='text-foreground'>{project.name}</span>
				</nav>

				<header className='mb-6 flex items-start justify-between gap-4'>
					<div>
						<h1 className={projectPageTitleClassName}>{project.name}</h1>
						<p className={projectPageSubtitleClassName}>{project.description ?? ''}</p>
					</div>

					<div className='flex shrink-0 items-center gap-2'>
						<Button
							type='button'
							variant='outline'
							size='icon-sm'
							onClick={() => setIsEditDialogOpen(true)}
							aria-label='Редактировать проект'
						>
							<Pencil className='size-4' />
						</Button>
						<Button
							type='button'
							variant='outline'
							size='icon-sm'
							onClick={() => setIsDeleteDialogOpen(true)}
							aria-label='Удалить проект'
							className='text-destructive hover:border-destructive/50 hover:text-destructive'
						>
							<Trash2 className='size-4' />
						</Button>
					</div>
				</header>

				<section className='mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
					{actionCards.map((card) => {
						const Icon = card.icon

						return (
							<button
								key={card.id}
								type='button'
								className='flex h-[112px] w-full flex-col justify-center gap-3 rounded-[var(--radius-surface)] border border-border bg-card p-5 text-left transition-colors hover:border-primary/30'
							>
								<div className='flex size-5 items-center justify-center'>
									<Icon className={cn('size-5', card.iconClassName)} />
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
									className='flex h-[88px] w-full items-center gap-4 rounded-[var(--radius-surface)] border border-border bg-card px-5 py-4 text-left transition-colors hover:border-primary/30'
								>
									<div className='flex size-5 shrink-0 items-center justify-center text-primary'>
										<KanbanSquare className='size-5' />
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
							<div className='rounded-[var(--radius-surface)] border border-dashed border-border bg-card px-5 py-8 text-[14px] text-muted-foreground sm:col-span-2'>
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

					<div className='overflow-hidden rounded-[var(--radius-surface)] border border-border bg-card shadow-[0_18px_32px_-28px_rgba(12,18,32,0.55)]'>
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

			<EditProjectDialog
				teamId={teamId}
				projectId={projectId}
				initialName={project.name}
				initialDescription={project.description ?? ''}
				open={isEditDialogOpen}
				onOpenChange={setIsEditDialogOpen}
			/>

			<ConfirmDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
				title='Удалить проект?'
				description='Проект и все связанные данные будут удалены без возможности восстановления.'
				confirmLabel='Удалить'
				pendingLabel='Удаление...'
				isPending={isDeleting}
				onConfirm={() => void handleDelete()}
			/>
		</div>
	)
}

export { ProjectDetailPageView }
