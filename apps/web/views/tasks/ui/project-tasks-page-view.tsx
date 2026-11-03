'use client'

import { useParams, useRouter } from 'next/navigation'
import { useRef } from 'react'

import { formatTaskCode, type TaskFilterParams } from '@repo/types'
import {
	Button,
	EmptyState,
	Input,
	Label,
	Pagination,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Skeleton,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@repo/ui'
import { ClipboardList, Plus } from '@repo/ui/icons'

import { TaskDetailsDialog, TaskLabels, useTaskDialogRoute } from '@/features/tasks'
import {
	TASK_PRIORITY_OPTIONS,
	TASK_STATUS_OPTIONS,
	TASK_TYPE_OPTIONS,
} from '@/features/tasks/model/form'
import { TaskPriorityBadge, TaskStatusBadge, TaskTypeBadge } from '@/entities/task'
import { useProjectDetail } from '@/shared/api/use-projects'
import { useTasksList } from '@/shared/api/use-tasks'
import { useTeamMemberOptions } from '@/shared/api/use-team-members'
import { teamRoutes } from '@/shared/config'
import { PageHeader } from '@/shared/ui/page-header'

import { useTaskFilters } from '../model/use-task-filters'

export function ProjectTasksPageView() {
	const router = useRouter()
	const params = useParams<{ id: string; projectId: string }>()
	const teamId = decodeURIComponent(params.id)
	const projectId = decodeURIComponent(params.projectId)
	const searchInput = useRef<HTMLInputElement>(null)
	const state = useTaskFilters()
	const taskDialog = useTaskDialogRoute()
	const project = useProjectDetail(teamId, projectId)
	const members = useTeamMemberOptions(teamId, true)
	const result = useTasksList(teamId, projectId, state.query)
	const tasks = result.data?.data ?? []
	const meta = result.data?.meta
	const create = () => router.push(teamRoutes.projectTasksNew(teamId, projectId))
	const reset = () => {
		state.reset()
		searchInput.current?.focus()
	}
	const options = [
		{ key: 'type', label: 'Тип задачи', all: 'Все типы', values: TASK_TYPE_OPTIONS },
		{
			key: 'status',
			label: 'Статус задачи',
			all: 'Все статусы',
			values: TASK_STATUS_OPTIONS,
		},
		{
			key: 'priority',
			label: 'Приоритет',
			all: 'Все приоритеты',
			values: TASK_PRIORITY_OPTIONS,
		},
	] as const
	const selectedAssignee = state.filters.assigneeId
	return (
		<div className='min-h-full w-full bg-background text-foreground'>
			<div className='mx-auto max-w-[1760px] space-y-6 px-4 py-5 sm:px-6'>
				<PageHeader
					title='Задачи'
					description={project.data?.name ?? 'Задачи проекта'}
					actions={
						<Button onClick={create}>
							<Plus className='size-4' />
							Создать задачу
						</Button>
					}
				/>
				<div className='flex flex-wrap items-end gap-3'>
					<div className='min-w-[min(100%,16rem)] flex-1 space-y-2'>
						<Label htmlFor='task-search'>Поиск задач</Label>
						<Input
							id='task-search'
							ref={searchInput}
							maxLength={255}
							value={state.filters.search ?? ''}
							placeholder='Поиск по названию, коду или метке'
							className='h-10'
							onChange={(event) => state.update({ search: event.target.value })}
						/>
					</div>
					{options.map((option) => (
						<div className='min-w-36 space-y-2' key={option.key}>
							<Label htmlFor={`filter-${option.key}`}>{option.label}</Label>
							<Select
								name={option.key}
								value={state.filters[option.key] ?? 'ALL'}
								onValueChange={(value) =>
									state.update({
										[option.key]: value === 'ALL' ? undefined : value,
									} as TaskFilterParams)
								}
							>
								<SelectTrigger id={`filter-${option.key}`}>
									<SelectValue />
								</SelectTrigger>
								<SelectContent
									position='popper'
									align='start'
									className='w-(--radix-select-trigger-width) max-w-(--radix-select-content-available-width) wrap-anywhere'
								>
									<SelectItem value='ALL'>{option.all}</SelectItem>
									{option.values.map((value) => (
										<SelectItem key={value.value} value={value.value}>
											{value.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					))}
					<div className='min-w-40 space-y-2'>
						<Label htmlFor='filter-assignee'>Исполнитель</Label>
						<Select
							name='assigneeId'
							value={selectedAssignee ?? 'ALL'}
							disabled={members.isPending}
							onValueChange={(value) =>
								state.update({
									assigneeId: value === 'ALL' ? undefined : value,
								})
							}
						>
							<SelectTrigger id='filter-assignee'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent
								position='popper'
								align='start'
								className='w-(--radix-select-trigger-width) max-w-(--radix-select-content-available-width) wrap-anywhere'
							>
								<SelectItem value='ALL'>Все исполнители</SelectItem>
								{selectedAssignee &&
									!members.data?.some((member) => member.userId === selectedAssignee) && (
										<SelectItem value={selectedAssignee}>Выбранный участник</SelectItem>
									)}
								{members.data?.map((member) => (
									<SelectItem key={member.userId} value={member.userId}>
										{member.name ?? member.email}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className='min-w-40 space-y-2'>
						<Label htmlFor='task-sort'>Сортировка</Label>
						<Select
							name='sortBy'
							value={state.filters.sortBy}
							onValueChange={(value) =>
								state.update({ sortBy: value as TaskFilterParams['sortBy'] })
							}
						>
							<SelectTrigger id='task-sort'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent
								position='popper'
								align='start'
								className='w-(--radix-select-trigger-width) max-w-(--radix-select-content-available-width) wrap-anywhere'
							>
								<SelectItem value='createdAt'>Дата создания</SelectItem>
								<SelectItem value='priority'>Приоритет</SelectItem>
								<SelectItem value='status'>Статус</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className='min-w-36 space-y-2'>
						<Label htmlFor='task-sort-order'>Порядок</Label>
						<Select
							name='sortOrder'
							value={state.filters.sortOrder}
							onValueChange={(value) =>
								state.update({
									sortOrder: value as TaskFilterParams['sortOrder'],
								})
							}
						>
							<SelectTrigger id='task-sort-order'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent
								position='popper'
								align='start'
								className='w-(--radix-select-trigger-width) max-w-(--radix-select-content-available-width) wrap-anywhere'
							>
								<SelectItem value='desc'>По убыванию</SelectItem>
								<SelectItem value='asc'>По возрастанию</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<Button
						variant='outline'
						size='lg'
						onClick={reset}
						disabled={
							!state.hasFilters &&
							state.filters.sortBy === 'createdAt' &&
							state.filters.sortOrder === 'desc'
						}
					>
						Сбросить фильтры
					</Button>
				</div>
				{members.isError && (
					<p role='alert' className='text-sm text-destructive'>
						Не удалось загрузить исполнителей.{' '}
						<Button
							variant='link'
							onClick={() => {
								void members.refetch()
							}}
						>
							Повторить загрузку
						</Button>
					</p>
				)}
				{(result.isFetching || state.pending) && (
					<p role='status' className='text-sm text-muted-foreground'>
						Обновляем список задач…
					</p>
				)}
				<div className='overflow-x-auto rounded-[var(--radius-surface)] border border-border bg-card'>
					{result.isError ? (
						<div className='flex min-h-[min(28rem,60dvh)] items-center justify-center px-4 py-8'>
							<EmptyState
								className='border-0'
								headingLevel='h2'
								title='Не удалось загрузить задачи'
								description='Повторите запрос, чтобы продолжить работу со списком.'
								actionLabel='Повторить'
								onAction={() => {
									void result.refetch()
								}}
							/>
						</div>
					) : result.isLoading ||
					  ((result.isFetching || state.pending) && !tasks.length) ? (
						<div role='status' aria-label='Загрузка задач' className='space-y-4 p-6'>
							{Array.from({ length: 5 }, (_, i) => (
								<Skeleton key={i} className='h-9 w-full' />
							))}
						</div>
					) : tasks.length ? (
						<table className='min-w-full text-left text-sm'>
							<thead className='border-b border-border text-muted-foreground'>
								<tr>
									{[
										'Ключ',
										'Тип',
										'Название',
										'Статус',
										'Приоритет',
										'Исполнитель',
										'Создана',
									].map((label) => (
										<th key={label} scope='col' className='px-4 py-3 font-medium'>
											{label}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{tasks.map((task) => {
									return (
										<tr
											key={task.id}
											className='border-b border-border last:border-b-0 hover:bg-muted/40'
										>
											<td className='px-4 py-3'>
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger asChild>
															<span
																className='block max-w-32 truncate rounded-sm font-mono text-xs text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring'
																tabIndex={0}
															>
																{formatTaskCode(task.id)}
															</span>
														</TooltipTrigger>
														<TooltipContent sideOffset={8}>ID: {task.id}</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</td>
											<td className='px-4 py-3'>
												<TaskTypeBadge type={task.type} />
											</td>
											<td className='min-w-52 max-w-80 break-words px-4 py-3'>
												<a
													href={taskDialog.href(task.id)}
													aria-haspopup='dialog'
													className='font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
													onClick={(event) => {
														if (
															!event.metaKey &&
															!event.ctrlKey &&
															!event.shiftKey &&
															!event.altKey
														) {
															event.preventDefault()
															taskDialog.open(task.id)
														}
													}}
												>
													{task.title}
												</a>
												<TaskLabels labels={task.labels} className='mt-2' />
											</td>
											<td className='px-4 py-3'>
												<TaskStatusBadge status={task.status} />
											</td>
											<td className='px-4 py-3'>
												<TaskPriorityBadge priority={task.priority} />
											</td>
											<td className='px-4 py-3'>
												{task.assigneeId
													? (members.data?.find(
															(member) => member.userId === task.assigneeId,
														)?.name ?? 'Назначенный участник')
													: 'Без исполнителя'}
											</td>
											<td className='whitespace-nowrap px-4 py-3'>
												{new Intl.DateTimeFormat('ru-RU', { timeZone: 'UTC' }).format(
													new Date(task.createdAt),
												)}
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					) : (
						<div className='flex min-h-[min(28rem,60dvh)] items-center justify-center px-4 py-8'>
							<EmptyState
								className='border-0'
								headingLevel='h2'
								icon={<ClipboardList className='size-7' />}
								title={
									state.hasFilters ? 'Задачи не найдены' : 'В проекте пока нет задач'
								}
								description={
									state.hasFilters
										? 'Попробуйте изменить параметры поиска или фильтрации.'
										: 'Создайте первую задачу, чтобы начать работу над проектом.'
								}
								actionLabel={
									state.hasFilters ? 'Сбросить фильтры' : 'Создать первую задачу'
								}
								onAction={state.hasFilters ? reset : create}
							/>
						</div>
					)}
				</div>
				{meta && meta.totalPages > 1 && (
					<Pagination meta={meta} onPageChange={state.setPage} />
				)}
			</div>
			{taskDialog.taskId && (
				<TaskDetailsDialog
					key={taskDialog.taskId}
					teamId={teamId}
					projectId={projectId}
					taskId={taskDialog.taskId}
					projectName={project.data?.name}
					onClose={taskDialog.close}
				/>
			)}
		</div>
	)
}
