'use client'

import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'

import type { TaskStatus as ApiTaskStatus, TaskType as ApiTaskType } from '@repo/types'
import {
	Avatar,
	AvatarFallback,
	Button,
	cn,
	EmptyState,
	Pagination,
	Skeleton,
	usePagination,
} from '@repo/ui'
import {
	AlertTriangle,
	BookOpen,
	Bug,
	Check,
	ChevronDown,
	CircleDot,
	ClipboardList,
	Plus,
	Zap,
} from '@repo/ui/icons'

import { useProjectDetail } from '@/shared/api/use-projects'
import { useTasksList } from '@/shared/api/use-tasks'
import { useTeamMembers } from '@/shared/api/use-team-members'

const TASK_LIMIT = 20
const ALL = 'ALL'

const TYPE_ICON: Record<ApiTaskType, React.ReactNode> = {
	TASK: <CircleDot className='size-4 text-blue-400' />,
	BUG: <Bug className='size-4 text-rose-400' />,
	STORY: <BookOpen className='size-4 text-emerald-400' />,
	EPIC: <Zap className='size-4 text-violet-400' />,
	TECH_DEBT: <AlertTriangle className='size-4 text-amber-400' />,
}

const STATUS_LABEL: Record<ApiTaskStatus, string> = {
	BACKLOG: 'Backlog',
	TODO: 'To Do',
	IN_PROGRESS: 'In Progress',
	IN_REVIEW: 'Review',
	DONE: 'Done',
}

const STATUS_CLASS: Record<ApiTaskStatus, string> = {
	BACKLOG: 'text-muted-foreground',
	TODO: 'text-foreground',
	IN_PROGRESS: 'text-amber-400',
	IN_REVIEW: 'text-orange-400',
	DONE: 'text-emerald-400',
}

const PRIORITY_LABEL: Record<string, string> = {
	CRITICAL: 'critical',
	HIGH: 'high',
	MEDIUM: 'medium',
	LOW: 'low',
}

const PRIORITY_CLASS: Record<string, string> = {
	CRITICAL: 'bg-red-500/15 text-red-400',
	HIGH: 'bg-orange-500/15 text-orange-400',
	MEDIUM: 'bg-blue-500/15 text-blue-400',
}

const TYPE_OPTIONS = [
	{ value: ALL, label: 'Все типы' },
	{ value: 'TASK', label: 'Задача' },
	{ value: 'BUG', label: 'Баг' },
	{ value: 'STORY', label: 'Стори' },
	{ value: 'EPIC', label: 'Эпик' },
	{ value: 'TECH_DEBT', label: 'Тех. долг' },
]

const STATUS_OPTIONS = [
	{ value: ALL, label: 'Все статусы' },
	{ value: 'BACKLOG', label: 'Backlog' },
	{ value: 'TODO', label: 'To Do' },
	{ value: 'IN_PROGRESS', label: 'In Progress' },
	{ value: 'IN_REVIEW', label: 'Review' },
	{ value: 'DONE', label: 'Done' },
]

const AVATAR_COLORS = [
	'bg-blue-500',
	'bg-rose-500',
	'bg-emerald-500',
	'bg-violet-500',
	'bg-amber-500',
	'bg-cyan-500',
]

const selectClass =
	'h-10 rounded-[var(--radius-control)] border border-border bg-background px-4 text-[14px] text-foreground transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none cursor-pointer'

function getAvatarColor(userId: string): string {
	let hash = 0
	for (let i = 0; i < userId.length; i++)
		hash = userId.charCodeAt(i) + ((hash << 5) - hash)
	return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!
}

function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/)
	if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
	return name.slice(0, 2).toUpperCase()
}

const TableHead = () => (
	<thead className='border-b border-border'>
		<tr className='text-left text-[13px] text-muted-foreground'>
			<th className='w-10 px-4 py-3' />
			<th className='min-w-[72px] px-3 py-3 font-medium'>Ключ</th>
			<th className='w-10 px-3 py-3 font-medium'>Тип</th>
			<th className='px-3 py-3 font-medium'>Название</th>
			<th className='min-w-[110px] px-3 py-3 font-medium'>Статус</th>
			<th className='min-w-[100px] px-3 py-3 font-medium'>Приоритет</th>
			<th className='min-w-[130px] px-3 py-3 font-medium'>Исполнитель</th>
		</tr>
	</thead>
)

export function ProjectTasksPageView() {
	const params = useParams<{ id: string; projectId: string }>()
	const teamId = decodeURIComponent(params.id)
	const projectId = decodeURIComponent(params.projectId)

	const [search, setSearch] = useState('')
	const [typeFilter, setTypeFilter] = useState<string>(ALL)
	const [statusFilter, setStatusFilter] = useState<string>(ALL)
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
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

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase()
		if (!q) return tasks
		return tasks.filter((t) => t.title.toLowerCase().includes(q))
	}, [tasks, search])

	const handleTypeChange = (value: string) => {
		setTypeFilter(value)
		setPage(1)
	}

	const handleStatusChange = (value: string) => {
		setStatusFilter(value)
		setPage(1)
	}

	const handleSearchChange = (value: string) => {
		setSearch(value)
		setPage(1)
	}

	const toggleSelect = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev)
			if (next.has(id)) {
				next.delete(id)
			} else {
				next.add(id)
			}
			return next
		})
	}

	const hasActiveFilters = search !== '' || typeFilter !== ALL || statusFilter !== ALL

	return (
		<div className='min-h-full w-full bg-background text-foreground'>
			<div className='mx-auto max-w-[1100px] px-6 py-6'>
				<header className='mb-6 flex items-start justify-between gap-4'>
					<div>
						<h1 className='text-[32px] font-bold leading-tight tracking-tight'>Задачи</h1>
						<p className='mt-0.5 text-[14px] text-muted-foreground'>
							{project?.name ?? '...'}
						</p>
					</div>
					<Button className='h-10 shrink-0 rounded-[var(--radius-control)] bg-primary px-5 text-[14px] font-medium text-primary-foreground hover:bg-primary/90'>
						<Plus className='mr-1.5 size-4' />
						Создать задачу
					</Button>
				</header>

				<div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center'>
					<div className='relative flex-1'>
						<input
							type='text'
							placeholder='Поиск по названию...'
							value={search}
							onChange={(e) => handleSearchChange(e.target.value)}
							className='h-10 w-full rounded-[var(--radius-control)] border border-border bg-background py-0 pl-10 pr-3 text-[14px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
						/>
						<svg
							className='pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth={2}
						>
							<circle cx='11' cy='11' r='8' />
							<path d='m21 21-4.35-4.35' />
						</svg>
					</div>

					<div className='relative'>
						<select
							value={typeFilter}
							onChange={(e) => handleTypeChange(e.target.value)}
							className={cn(selectClass, 'pr-9')}
						>
							{TYPE_OPTIONS.map((o) => (
								<option key={o.value} value={o.value}>
									{o.label}
								</option>
							))}
						</select>
						<ChevronDown className='pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
					</div>

					<div className='relative'>
						<select
							value={statusFilter}
							onChange={(e) => handleStatusChange(e.target.value)}
							className={cn(selectClass, 'pr-9')}
						>
							{STATUS_OPTIONS.map((o) => (
								<option key={o.value} value={o.value}>
									{o.label}
								</option>
							))}
						</select>
						<ChevronDown className='pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
					</div>
				</div>

				{selectedIds.size > 0 && (
					<div className='mb-3 flex items-center gap-6 rounded-[var(--radius-control)] border border-border bg-card px-4 py-2.5 text-[14px]'>
						<span className='text-muted-foreground'>
							Выбрано:{' '}
							<span className='font-semibold text-foreground'>{selectedIds.size}</span>
						</span>
						<button type='button' className='transition-colors hover:text-primary'>
							Назначить
						</button>
						<button type='button' className='transition-colors hover:text-primary'>
							Изменить статус
						</button>
						<button
							type='button'
							onClick={() => setSelectedIds(new Set())}
							className='ml-auto text-muted-foreground transition-colors hover:text-foreground'
						>
							Снять выбор
						</button>
					</div>
				)}

				<div className='overflow-x-auto rounded-[var(--radius-surface)] border border-border bg-card'>
					{isLoading ? (
						<table className='min-w-full border-collapse text-[14px]'>
							<TableHead />
							<tbody>
								{Array.from({ length: 5 }).map((_, i) => (
									<tr key={i} className='border-b border-border last:border-b-0'>
										<td className='px-4 py-3'>
											<Skeleton className='size-[18px] rounded-[4px]' />
										</td>
										<td className='px-3 py-3'>
											<Skeleton className='h-4 w-12' />
										</td>
										<td className='px-3 py-3'>
											<Skeleton className='size-4 rounded-full' />
										</td>
										<td className='px-3 py-3'>
											<Skeleton className='h-4 w-56' />
										</td>
										<td className='px-3 py-3'>
											<Skeleton className='h-4 w-20' />
										</td>
										<td className='px-3 py-3'>
											<Skeleton className='h-5 w-16 rounded' />
										</td>
										<td className='px-3 py-3'>
											<Skeleton className='h-4 w-24' />
										</td>
									</tr>
								))}
							</tbody>
						</table>
					) : filtered.length > 0 ? (
						<table className='min-w-full border-collapse text-[14px]'>
							<TableHead />
							<tbody>
								{filtered.map((task, index) => {
									const rowIndex =
										((paginationParams.page ?? 1) - 1) * TASK_LIMIT + index + 1
									const assigneeName = task.assigneeId
										? (memberMap.get(task.assigneeId) ?? null)
										: null
									const isSelected = selectedIds.has(task.id)

									return (
										<tr
											key={task.id}
											className={cn(
												'border-b border-border transition-colors last:border-b-0',
												isSelected ? 'bg-primary/5' : 'hover:bg-muted/40',
											)}
										>
											<td className='px-4 py-3' onClick={(e) => e.stopPropagation()}>
												<button
													type='button'
													onClick={() => toggleSelect(task.id)}
													className={cn(
														'flex size-[18px] cursor-pointer items-center justify-center rounded-[4px] border-2 transition-colors',
														isSelected
															? 'border-primary bg-primary text-primary-foreground'
															: 'border-border hover:border-primary/60',
													)}
												>
													{isSelected && <Check className='size-2.5 stroke-[3]' />}
												</button>
											</td>
											<td className='px-3 py-3 font-mono text-[13px] text-muted-foreground'>
												#{rowIndex}
											</td>
											<td className='px-3 py-3'>
												{task.type ? (
													<span title={task.type}>{TYPE_ICON[task.type]}</span>
												) : null}
											</td>
											<td className='max-w-[340px] px-3 py-3 font-medium'>
												<span className='line-clamp-1'>{task.title}</span>
											</td>
											<td className='px-3 py-3'>
												<span
													className={cn(
														'text-[14px] font-medium',
														STATUS_CLASS[task.status],
													)}
												>
													{STATUS_LABEL[task.status]}
												</span>
											</td>
											<td className='px-3 py-3'>
												{task.priority === 'LOW' ? (
													<span className='text-[13px] text-muted-foreground'>low</span>
												) : (
													<span
														className={cn(
															'rounded px-2 py-0.5 text-[12px] font-medium',
															PRIORITY_CLASS[task.priority],
														)}
													>
														{PRIORITY_LABEL[task.priority]}
													</span>
												)}
											</td>
											<td className='px-3 py-3'>
												{assigneeName ? (
													<div className='flex items-center gap-2'>
														<Avatar size='sm'>
															<AvatarFallback
																className={cn(
																	'text-[11px] font-semibold text-white',
																	getAvatarColor(task.assigneeId!),
																)}
															>
																{getInitials(assigneeName)}
															</AvatarFallback>
														</Avatar>
														<span className='text-[13px]'>
															{assigneeName.split(' ')[0]}
														</span>
													</div>
												) : (
													<span className='text-muted-foreground'>—</span>
												)}
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					) : (
						<div className='px-6 py-16'>
							<EmptyState
								icon={<ClipboardList className='size-7' />}
								title='Задачи не найдены'
								description={
									hasActiveFilters
										? 'Попробуйте изменить параметры поиска или фильтрации.'
										: 'В этом проекте пока нет задач.'
								}
							/>
						</div>
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
