'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'

import type { TaskStatus as ApiTaskStatus, TaskType as ApiTaskType } from '@repo/types'
import {
	EmptyState,
	Pagination,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Skeleton,
	usePagination,
} from '@repo/ui'
import { ChevronRight, ListFilter } from '@repo/ui/icons'

import {
	TaskPriorityBadge,
	TaskStatusBadge,
	TaskTypeBadge,
	type TaskType as EntityTaskType,
} from '@/entities/task'
import { useProjectDetail } from '@/shared/api/use-projects'
import { useTasksList } from '@/shared/api/use-tasks'
import { useTeamMembers } from '@/shared/api/use-team-members'
import { ROUTES, teamRoutes } from '@/shared/config'

const TASK_LIMIT = 20
const ALL = 'ALL'

const API_TYPE_TO_ENTITY: Record<ApiTaskType, EntityTaskType> = {
	EPIC: 'Эпик',
	STORY: 'Стори',
	BUG: 'Баг',
	TECH_DEBT: 'Тех. долг',
	TASK: 'Задача',
}

const TYPE_OPTIONS: Array<{ label: string; value: string }> = [
	{ label: 'Все типы', value: ALL },
	{ label: 'Эпик', value: 'EPIC' },
	{ label: 'Стори', value: 'STORY' },
	{ label: 'Задача', value: 'TASK' },
	{ label: 'Баг', value: 'BUG' },
	{ label: 'Тех. долг', value: 'TECH_DEBT' },
]

const STATUS_OPTIONS: Array<{ label: string; value: string }> = [
	{ label: 'Все статусы', value: ALL },
	{ label: 'Бэклог', value: 'BACKLOG' },
	{ label: 'К выполнению', value: 'TODO' },
	{ label: 'В работе', value: 'IN_PROGRESS' },
	{ label: 'Ревью', value: 'IN_REVIEW' },
	{ label: 'Готово', value: 'DONE' },
]

export function ProjectTasksPageView() {
	const params = useParams<{ id: string; projectId: string }>()
	const teamId = decodeURIComponent(params.id)
	const projectId = decodeURIComponent(params.projectId)

	const [typeFilter, setTypeFilter] = useState<string>(ALL)
	const [statusFilter, setStatusFilter] = useState<string>(ALL)
	const { paginationParams, setPage } = usePagination({ initialLimit: TASK_LIMIT })

	const filterParams = useMemo(
		() => ({
			...paginationParams,
			...(typeFilter !== ALL && { type: typeFilter as ApiTaskType }),
			...(statusFilter !== ALL && { status: statusFilter as ApiTaskStatus }),
		}),
		[paginationParams, typeFilter, statusFilter],
	)

	const { data: project } = useProjectDetail(teamId, projectId)
	const { data: membersData } = useTeamMembers(teamId)
	const { data, isLoading } = useTasksList(teamId, projectId, filterParams)

	const tasks = data?.data ?? []
	const meta = data?.meta

	const memberMap = useMemo(() => {
		const map = new Map<string, string>()
		membersData?.data?.forEach((m) => {
			if (m.name) map.set(m.userId, m.name)
		})
		return map
	}, [membersData])

	const handleTypeChange = (value: string) => {
		setTypeFilter(value)
		setPage(1)
	}

	const handleStatusChange = (value: string) => {
		setStatusFilter(value)
		setPage(1)
	}

	return (
		<div className='min-h-full w-full bg-background text-foreground'>
			<div className='mx-auto max-w-[1200px] px-6 py-5'>
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
					<Link
						href={teamRoutes.project(teamId, projectId)}
						className='transition-colors hover:text-foreground'
					>
						{project?.name ?? '...'}
					</Link>
					<ChevronRight className='size-4 text-muted-foreground/70' />
					<span className='text-foreground'>Задачи</span>
				</nav>

				<header className='mb-5'>
					<h1 className='text-[34px] font-semibold leading-[1] tracking-tight'>Задачи</h1>
					<p className='mt-1.5 text-[15px] text-muted-foreground'>
						Список задач проекта {project?.name ?? ''}
					</p>
				</header>

				<div className='mb-4 flex flex-wrap gap-3'>
					<Select value={typeFilter} onValueChange={handleTypeChange}>
						<SelectTrigger className='h-9 w-[160px] rounded-[var(--radius-control)] border-border text-[13px]'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{TYPE_OPTIONS.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select value={statusFilter} onValueChange={handleStatusChange}>
						<SelectTrigger className='h-9 w-[160px] rounded-[var(--radius-control)] border-border text-[13px]'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{STATUS_OPTIONS.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className='overflow-x-auto rounded-[var(--radius-surface)] border border-border bg-card'>
					<table className='min-w-full border-collapse'>
						<thead className='border-b border-border'>
							<tr className='text-left text-[13px] text-muted-foreground'>
								<th className='min-w-[56px] px-4 py-3 font-semibold'>#</th>
								<th className='min-w-[320px] px-3 py-3 font-semibold'>Название</th>
								<th className='min-w-[110px] px-3 py-3 font-semibold'>Тип</th>
								<th className='min-w-[130px] px-3 py-3 font-semibold'>Статус</th>
								<th className='min-w-[80px] px-3 py-3 font-semibold'>Приор.</th>
								<th className='min-w-[140px] px-3 py-3 font-semibold'>Исполнитель</th>
								<th className='min-w-[110px] px-3 py-3 font-semibold'>Дата</th>
							</tr>
						</thead>
						<tbody>
							{isLoading &&
								Array.from({ length: 5 }).map((_, i) => (
									<tr key={i} className='border-b border-border last:border-b-0'>
										<td className='px-4 py-3'>
											<Skeleton className='h-4 w-8' />
										</td>
										<td className='px-3 py-3'>
											<Skeleton className='h-4 w-56' />
										</td>
										<td className='px-3 py-3'>
											<Skeleton className='h-5 w-16 rounded-full' />
										</td>
										<td className='px-3 py-3'>
											<Skeleton className='h-5 w-24 rounded-full' />
										</td>
										<td className='px-3 py-3'>
											<Skeleton className='size-4' />
										</td>
										<td className='px-3 py-3'>
											<Skeleton className='h-4 w-20' />
										</td>
										<td className='px-3 py-3'>
											<Skeleton className='h-4 w-20' />
										</td>
									</tr>
								))}

							{!isLoading &&
								tasks.map((task, index) => {
									const rowIndex =
										((paginationParams.page ?? 1) - 1) * TASK_LIMIT + index + 1
									const assigneeName = task.assigneeId
										? (memberMap.get(task.assigneeId) ?? '—')
										: '—'
									const dueDate = task.dueDate
										? new Date(task.dueDate).toLocaleDateString('ru-RU', {
												day: '2-digit',
												month: '2-digit',
												year: 'numeric',
											})
										: '—'

									return (
										<tr
											key={task.id}
											className='border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors'
										>
											<td className='px-4 py-3 text-[13px] font-medium text-muted-foreground'>
												#{rowIndex}
											</td>
											<td className='px-3 py-3 text-[14px] font-medium text-foreground'>
												{task.title}
											</td>
											<td className='px-3 py-3 leading-none'>
												{task.type ? (
													<TaskTypeBadge
														type={API_TYPE_TO_ENTITY[task.type]}
														className='h-[20px] rounded-full px-2 text-[11px] font-semibold'
													/>
												) : (
													<span className='text-[13px] text-muted-foreground'>—</span>
												)}
											</td>
											<td className='px-3 py-3 leading-none'>
												<TaskStatusBadge status={task.status} />
											</td>
											<td className='px-3 py-3'>
												<TaskPriorityBadge priority={task.priority} />
											</td>
											<td className='px-3 py-3 text-[13px] text-foreground'>
												{assigneeName}
											</td>
											<td className='px-3 py-3 text-[13px] text-muted-foreground'>
												{dueDate}
											</td>
										</tr>
									)
								})}
						</tbody>
					</table>

					{!isLoading && tasks.length === 0 && (
						<EmptyState
							icon={<ListFilter className='size-6' />}
							title='Нет задач'
							description={
								typeFilter !== ALL || statusFilter !== ALL
									? 'Нет задач, соответствующих выбранным фильтрам.'
									: 'В этом проекте пока нет задач.'
							}
							className='border-0 bg-transparent py-16'
						/>
					)}
				</div>

				{meta && meta.totalPages > 1 && (
					<div className='mt-4'>
						<Pagination meta={meta} onPageChange={setPage} />
					</div>
				)}
			</div>
		</div>
	)
}
