'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button, cn, ConfirmDialog, EmptyState, Skeleton, toast } from '@repo/ui'
import {
	Activity,
	Bot,
	ChevronRight,
	FolderKanban,
	KanbanSquare,
	ListFilter,
	Pencil,
	Plus,
	SquareKanban,
	Trash2,
} from '@repo/ui/icons'

import { useDeleteProject, useProjectDetail } from '@/shared/api/use-projects'
import { ROUTES, teamRoutes } from '@/shared/config'
import { isApiError } from '@/shared/lib/api/utils'

import { projectPageSubtitleClassName, projectPageTitleClassName } from '../lib/styles'
import { EditProjectDialog } from './edit-project-dialog'

const actionCards = [
	{
		id: 'open-board',
		title: 'Открыть доску',
		description: 'Kanban Board',
		icon: SquareKanban,
		iconClassName: 'text-primary',
		iconBgClassName: 'bg-primary/15',
	},
	{
		id: 'all-tasks',
		title: 'Все задачи',
		description: 'Список и фильтры',
		icon: ListFilter,
		iconClassName: 'text-emerald-400',
		iconBgClassName: 'bg-emerald-400/15',
	},
	{
		id: 'ai-generation',
		title: 'AI Генератор',
		description: 'Создать задачи из идеи',
		icon: Bot,
		iconClassName: 'text-accent',
		iconBgClassName: 'bg-accent/15',
	},
] as const

function ProjectDetailPageView() {
	const router = useRouter()
	const params = useParams<{ id: string; projectId: string }>()
	const teamId = decodeURIComponent(params.id)
	const projectId = decodeURIComponent(params.projectId)
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

	type RecentActivity = {
		id: string
		type: 'BUG' | 'TASK' | 'EPIC'
		key: string
		title: string
		board: string
		status: string
	}
	const recentActivities: RecentActivity[] = []

	const typeBadgeClassName: Record<RecentActivity['type'], string> = {
		BUG: 'bg-red-500/20 text-red-400',
		TASK: 'bg-blue-500/20 text-blue-400',
		EPIC: 'bg-purple-500/20 text-purple-400',
	}

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
							<Skeleton key={i} className='h-[82px] rounded-lg' />
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
					<Link href={ROUTES.teams} className='transition-colors hover:text-foreground'>
						Команды
					</Link>
					<ChevronRight className='size-4 text-muted-foreground/70' />
					<Link
						href={teamRoutes.projects(teamId)}
						className='transition-colors hover:text-foreground'
					>
						Проекты
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
								className='flex w-full items-center gap-4 rounded-lg border border-border bg-card p-5 text-left transition-all hover:border-primary/40'
							>
								<div
									className={cn(
										'flex size-10 shrink-0 items-center justify-center rounded-md',
										card.iconBgClassName,
									)}
								>
									<Icon className={cn('size-5', card.iconClassName)} />
								</div>
								<div>
									<div className='text-[15px] font-semibold leading-5 tracking-tight'>
										{card.title}
									</div>
									<div className='mt-0.5 text-[12px] text-muted-foreground'>
										{card.description}
									</div>
								</div>
							</button>
						)
					})}
				</section>

				<section className='mb-7'>
					<div className='mb-4 flex items-center justify-between'>
						<h2 className='text-[20px] font-semibold tracking-tight'>Доски</h2>
						<button
							type='button'
							className='flex items-center gap-1.5 text-[14px] text-muted-foreground transition-colors hover:text-foreground'
						>
							<Plus className='size-4' />
							<span>Создать доску</span>
						</button>
					</div>
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
						<h2 className='text-[20px] font-semibold tracking-tight'>
							Последняя активность
						</h2>
					</div>
					{recentActivities.length > 0 ? (
						<div className='flex flex-col gap-3'>
							{recentActivities.map((item) => (
								<div
									key={item.id}
									className='flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3'
								>
									<span
										className={cn(
											'shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold',
											typeBadgeClassName[item.type],
										)}
									>
										{item.type}
									</span>
									<span className='shrink-0 text-[13px] text-muted-foreground'>
										{item.key}
									</span>
									<span className='min-w-0 flex-1 truncate text-[14px]'>
										{item.title}
									</span>
									<div className='flex shrink-0 items-center gap-2'>
										<span className='rounded border border-border px-2 py-0.5 text-[12px] text-muted-foreground'>
											{item.board}
										</span>
										<span className='text-[12px] font-medium text-blue-400'>
											{item.status}
										</span>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className='rounded-lg border border-dashed border-border bg-card px-5 py-8 text-[14px] text-muted-foreground'>
							Нет активностей
						</div>
					)}
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
