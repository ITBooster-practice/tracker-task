'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'

import { FEATURE_KEYS } from '@repo/types'
import { Button, cn, ConfirmDialog, EmptyState, Skeleton, toast } from '@repo/ui'
import {
	Activity,
	Bot,
	ChevronRight,
	FolderKanban,
	ListFilter,
	Pencil,
	SquareKanban,
	Trash2,
} from '@repo/ui/icons'

import { ProjectBoardsSection } from '@/views/boards/ui/project-boards-section'
import { useDeleteProject, useProjectDetail } from '@/shared/api/use-projects'
import { ROUTES, teamRoutes } from '@/shared/config'
import { isApiError } from '@/shared/lib/api/utils'
import { useFeature } from '@/shared/lib/feature-flags/context'
import { PageHeader } from '@/shared/ui/page-header'

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
	const aiEnabled = useFeature(FEATURE_KEYS.AI_ASSISTANT)
	const visibleActionCards = actionCards.filter(
		(card) => card.id !== 'ai-generation' || aiEnabled,
	)
	const actionGridClassName = cn('mb-7 grid gap-4 sm:grid-cols-2', {
		'lg:grid-cols-3': visibleActionCards.length === 3,
	})
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
				<div className='mx-auto max-w-[960px] px-4 py-5 sm:px-6'>
					<Skeleton className='mb-3 h-4 w-48' />
					<div className='mb-6'>
						<Skeleton className='mb-2 h-9 w-64' />
						<Skeleton className='h-4 w-96' />
					</div>
					<div className={actionGridClassName}>
						{visibleActionCards.map((card) => (
							<Skeleton key={card.id} className='h-[82px] rounded-lg' />
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
			<div className='mx-auto max-w-[960px] px-4 py-5 sm:px-6'>
				<PageHeader
					title={project.name}
					description={project.description?.trim() || 'Доски и задачи проекта.'}
					className='mb-6'
					navigation={
						<nav
							aria-label='Хлебные крошки'
							className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'
						>
							<Link
								href={ROUTES.teams}
								className='transition-colors hover:text-foreground'
							>
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
							<span className='text-foreground' aria-current='page'>
								{project.name}
							</span>
						</nav>
					}
					actions={
						<>
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
						</>
					}
				/>

				<section className={actionGridClassName}>
					{visibleActionCards.map((card) => {
						const Icon = card.icon
						const handleClick =
							card.id === 'all-tasks'
								? () => router.push(teamRoutes.projectTasks(teamId, projectId))
								: card.id === 'open-board'
									? () => router.push(teamRoutes.projectBoard(teamId, projectId))
									: undefined

						return (
							<button
								key={card.id}
								type='button'
								onClick={handleClick}
								className='flex w-full cursor-pointer items-center gap-4 rounded-lg border border-border bg-card p-5 text-left transition-all hover:border-primary/40'
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

				<ProjectBoardsSection teamId={teamId} projectId={projectId} />

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
