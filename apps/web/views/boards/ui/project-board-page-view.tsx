'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { type BoardView } from '@repo/types'
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	EmptyState,
	Skeleton,
	toast,
} from '@repo/ui'
import { ChevronDown, ChevronLeft, ChevronRight, Plus, Settings2 } from '@repo/ui/icons'

import { TaskCreateDialog, TaskDetailsDialog, useTaskDialogRoute } from '@/features/tasks'
import { useUserStore } from '@/entities/user'
import { useBoardsList } from '@/shared/api/use-boards'
import { useProjectDetail } from '@/shared/api/use-projects'
import { useBoardQuery, useMoveTask } from '@/shared/api/use-tasks'
import { useTeamMemberOptions } from '@/shared/api/use-team-members'
import { ROUTES, teamRoutes } from '@/shared/config'
import { PageHeader } from '@/shared/ui/page-header'

import { toBoardColumnsViewModel } from '../model/adapters'
import { buildBoardLanes, laneColumns } from '../model/board-swimlanes'
import {
	filterProjectBoardColumns,
	fullBoardMovePosition,
	hasProjectBoardFilters,
	projectBoardAssigneeOptions,
} from '../model/project-board-filters'
import { formatBoardTaskCount } from '../model/task-count'
import type { BoardTaskMoveInput } from '../model/types'
import { useProjectBoardFilters } from '../model/use-project-board-filters'
import { findBoardTask } from '../model/utils'
import { Board } from './board'
import { BoardEditorDialog } from './board-editor-dialog'
import { BoardEmptyState } from './board-empty-state'
import { BoardToolbar } from './board-toolbar'
import { CreateBoardDialog } from './create-board-dialog'

interface ProjectBoardPageViewProps {
	teamId: string
	projectId: string
	boardId?: string
}

function ProjectBoardContent({
	view,
	teamId,
	projectName,
	renderHeader,
	canManage,
}: {
	view: BoardView
	teamId: string
	projectName?: string
	renderHeader: (actions?: ReactNode, taskCount?: string) => ReactNode
	canManage: boolean
}) {
	const taskDialog = useTaskDialogRoute()
	const [createColumnId, setCreateColumnId] = useState<string | null>(null)
	const [taskBusy, setTaskBusy] = useState(false)
	const [editor, setEditor] = useState<{
		columnId?: string
	} | null>(null)
	const currentUserId = useUserStore((state) => state.user?.id)
	const membersQuery = useTeamMemberOptions(teamId, true)
	const {
		filters,
		effectiveFilters,
		isPending: filtersPending,
		update: updateFilters,
		reset: resetFilters,
		grouping,
		setGrouping,
	} = useProjectBoardFilters()
	const searchInput = useRef<HTMLInputElement>(null)
	const clearFilters = () => {
		resetFilters()
		searchInput.current?.focus()
	}
	const assignees = useMemo(
		() =>
			(membersQuery.data ?? []).map((member) => {
				const name = member.name || member.email
				return {
					id: member.userId,
					name,
					initials: name
						.split(/\s+/)
						.map((part) => part[0])
						.slice(0, 2)
						.join('')
						.toUpperCase(),
				}
			}),
		[membersQuery.data],
	)
	const crudBusy = useRef(false)
	const setTaskPending = useCallback((pending: boolean) => {
		crudBusy.current = pending
		setTaskBusy(pending)
	}, [])
	const moving = useRef(false)
	const mounted = useRef(true)
	useEffect(() => {
		mounted.current = true
		return () => {
			mounted.current = false
		}
	}, [])
	const moveTask = useMoveTask({
		onError: (error) => {
			if (!mounted.current) return
			toast.error(
				error.statusCode === 403
					? 'Недостаточно прав для изменения задачи.'
					: error.statusCode === 409
						? 'Доска изменилась. Попробуйте переместить задачу ещё раз.'
						: 'Не удалось переместить задачу. Попробуйте ещё раз.',
			)
		},
	})
	const columns = useMemo(
		() => toBoardColumnsViewModel(view, assignees),
		[view, assignees],
	)
	const visibleColumns = useMemo(
		() => filterProjectBoardColumns(columns, effectiveFilters),
		[columns, effectiveFilters],
	)
	const lanes = useMemo(
		() => buildBoardLanes(grouping, columns, assignees),
		[grouping, columns, assignees],
	)
	const dragScope = JSON.stringify([grouping, filters])
	const latestDragScope = useRef(dragScope)
	latestDragScope.current = dragScope
	const assigneeOptions = useMemo(
		() => projectBoardAssigneeOptions(columns, assignees, filters.assignee),
		[columns, assignees, filters.assignee],
	)
	const totalTasks = columns.reduce((count, column) => count + column.tasks.length, 0)
	const visibleTasks = visibleColumns.reduce(
		(count, column) => count + column.tasks.length,
		0,
	)
	const createColumns = columns
	const isMutating = taskBusy || editor !== null
	const openCreateForm = (columnId?: string) => {
		if (crudBusy.current || moving.current || !createColumns.length) return
		if (columnId && !createColumns.some((column) => column.id === columnId)) return
		if (taskDialog.taskId) taskDialog.close()
		setCreateColumnId(
			columnId ??
				createColumns.find((column) => column.key === 'TODO')?.id ??
				createColumns[0]!.id,
		)
	}
	const handleMoveTask = ({
		taskId,
		toColumnId,
		toIndex,
		priority,
		assigneeId,
	}: BoardTaskMoveInput) => {
		if (
			moving.current ||
			moveTask.isPending ||
			crudBusy.current ||
			filtersPending ||
			isMutating
		)
			return
		const source = view.columns.find((column) =>
			column.tasks.some((task) => task.id === taskId),
		)
		const target = view.columns.find((column) => column.id === toColumnId)
		const task = source?.tasks.find((item) => item.id === taskId)
		if (!source || !target || !task) return
		const targetProjection =
			priority !== undefined || assigneeId !== undefined
				? laneColumns(visibleColumns, { priority, assigneeId })
				: visibleColumns
		const position = fullBoardMovePosition(
			columns,
			targetProjection,
			taskId,
			toColumnId,
			toIndex,
		)
		if (position === null || position < 0) return
		if (
			source.id === target.id &&
			source.tasks.findIndex((item) => item.id === taskId) === position &&
			(priority === undefined || priority === task.priority) &&
			(assigneeId === undefined || assigneeId === task.assigneeId)
		)
			return
		moving.current = true
		const requestScope = dragScope
		return moveTask
			.mutateAsync({
				teamId,
				projectId: view.board.projectId,
				boardId: view.board.id,
				taskId,
				body: {
					fromColumnId: source.id,
					toColumnId,
					position,
					expectedVersion: task.version,
					...(priority !== undefined && priority !== task.priority && { priority }),
					...(assigneeId !== undefined &&
						assigneeId !== task.assigneeId && { assigneeId }),
				},
			})
			.then((moved) => {
				if (!mounted.current || latestDragScope.current !== requestScope) return
				const projected = filterProjectBoardColumns(
					[{ ...target, tasks: [{ ...findBoardTask(columns, taskId)!, ...moved }] }],
					effectiveFilters,
				)
				if (!projected[0]!.tasks.length)
					toast.info('Задача перемещена и скрыта текущими фильтрами.')
			})
			.catch(() => undefined)
			.finally(() => {
				moving.current = false
			})
	}

	return (
		<>
			{renderHeader(
				<>
					{canManage && (
						<Button
							id={`board-settings-${view.board.id}`}
							variant='outline'
							disabled={isMutating || moveTask.isPending}
							onClick={() => setEditor({})}
						>
							<Settings2 aria-hidden />
							Настроить доску
						</Button>
					)}
					{createColumns.length > 0 && (
						<Button
							onClick={() => openCreateForm()}
							disabled={isMutating || moveTask.isPending}
						>
							<Plus aria-hidden='true' />
							Создать задачу
						</Button>
					)}
				</>,
				hasProjectBoardFilters(effectiveFilters)
					? `${visibleTasks} из ${formatBoardTaskCount(totalTasks, 'genitive')}`
					: formatBoardTaskCount(totalTasks),
			)}
			<BoardToolbar
				currentUserId={currentUserId}
				totalTasks={totalTasks}
				visibleTasks={visibleTasks}
				grouping={grouping}
				onGroupingChange={setGrouping}
				filters={filters}
				assigneeOptions={assigneeOptions}
				onChange={updateFilters}
				onReset={clearFilters}
				searchRef={searchInput}
				assigneesPending={membersQuery.isPending}
				assigneesError={membersQuery.isError}
				onRetryAssignees={() => {
					void membersQuery.refetch()
				}}
			/>
			{columns.length === 0 && (
				<EmptyState
					headingLevel='h2'
					className='mx-auto'
					title='На доске пока нет колонок'
					description='Добавьте колонку, чтобы распределять задачи по этапам.'
				/>
			)}
			{moveTask.isPending && (
				<span role='status' className='sr-only'>
					Сохраняем положение задачи
				</span>
			)}
			{columns.length > 0 && (
				<Board
					emptyState={
						visibleTasks === 0 ? (
							<BoardEmptyState
								totalTasks={totalTasks}
								filters={effectiveFilters}
								assigneeOptions={assigneeOptions}
								onCreateTask={() => openCreateForm()}
								onClearSearch={() => {
									updateFilters({ query: '' })
									searchInput.current?.focus()
								}}
								onResetFilters={clearFilters}
								disabled={isMutating || moveTask.isPending}
							/>
						) : undefined
					}
					grouping={grouping}
					lanes={lanes}
					columns={visibleColumns}
					columnTaskCounts={Object.fromEntries(
						columns.map((column) => [column.id, column.tasks.length]),
					)}
					onOpenTask={taskDialog.open}
					onCreateTask={createColumns.length ? openCreateForm : undefined}
					onMoveTask={handleMoveTask}
					disableInteraction={moveTask.isPending || isMutating || filtersPending}
					dragScope={dragScope}
					onConfigureColumn={
						canManage ? (columnId) => setEditor({ columnId }) : undefined
					}
					columnActionsDisabled={moveTask.isPending || isMutating}
				/>
			)}
			{editor && (
				<BoardEditorDialog
					teamId={teamId}
					projectId={view.board.projectId}
					projectName={projectName}
					view={view}
					selectedColumnId={editor.columnId}
					onClose={() => setEditor(null)}
				/>
			)}
			{taskDialog.taskId && (
				<TaskDetailsDialog
					key={taskDialog.taskId}
					teamId={teamId}
					projectId={view.board.projectId}
					taskId={taskDialog.taskId}
					projectName={projectName}
					boardName={view.board.name}
					onClose={taskDialog.close}
					onPendingChange={setTaskPending}
				/>
			)}
			{createColumnId && (
				<TaskCreateDialog
					teamId={teamId}
					projectId={view.board.projectId}
					columns={createColumns}
					initialColumnId={createColumnId}
					boardName={view.board.name}
					visibilityWarning={
						hasProjectBoardFilters(effectiveFilters)
							? currentUserId && effectiveFilters.assignee === currentUserId
								? 'Включён фильтр «Только мои». Задача без исполнителя будет скрыта.'
								: 'На доске включены фильтры. Новая задача может быть скрыта текущими условиями.'
							: undefined
					}
					onPendingChange={setTaskPending}
					onClose={() => setCreateColumnId(null)}
				/>
			)}
		</>
	)
}

function ProjectBoardPage({ teamId, projectId, boardId }: ProjectBoardPageViewProps) {
	const router = useRouter()
	const userId = useUserStore((state) => state.user?.id)
	const memberQuery = useTeamMemberOptions(teamId, true)
	const role = memberQuery.data?.find((member) => member.userId === userId)?.role
	const canManage = role === 'OWNER' || role === 'ADMIN'
	const openBoard = (id: string) => {
		const params = new URLSearchParams(window.location.search)
		params.delete('taskId')
		params.set('boardId', id)
		router.push(
			`${teamRoutes.projectBoard(teamId, projectId)}?${params}${window.location.hash}`,
		)
	}
	const [creatingBoard, setCreatingBoard] = useState(false)
	const projectQuery = useProjectDetail(teamId, projectId)
	const boardsQuery = useBoardsList(teamId, projectId)
	const selectedBoard =
		boardId !== undefined
			? boardsQuery.data?.find((board) => board.id === boardId)
			: (boardsQuery.data?.find((board) => board.isDefault) ?? boardsQuery.data?.[0])
	const boardQuery = useBoardQuery(teamId, projectId, selectedBoard?.id ?? '')
	const isLoading =
		boardsQuery.isPending || (Boolean(selectedBoard) && boardQuery.isPending)
	const hasError = boardsQuery.isError || (Boolean(selectedBoard) && boardQuery.isError)

	const retry = () => {
		if (boardsQuery.isError || !selectedBoard) void boardsQuery.refetch()
		else void boardQuery.refetch()
	}

	const renderHeader = (actions?: ReactNode, taskCount?: string) => (
		<>
			<PageHeader
				actions={actions}
				title={
					<span className='inline-flex max-w-full flex-wrap items-center gap-3'>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									type='button'
									variant='outline'
									className='h-auto min-w-0 max-w-full justify-start gap-2.5 border-border bg-card px-2.5 py-1.5 text-left text-[length:inherit] leading-[inherit] font-semibold tracking-[inherit] shadow-none'
									title='Переключить доску'
								>
									<span className='truncate py-1'>
										{boardQuery.data?.board.name ??
											selectedBoard?.name ??
											'Доска проекта'}
									</span>
									<ChevronDown aria-hidden className='size-5 shrink-0' />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align='start'
								className='w-(--radix-dropdown-menu-trigger-width) min-w-0 max-w-(--radix-dropdown-menu-content-available-width)'
							>
								{boardsQuery.data?.map((board) => (
									<DropdownMenuItem
										key={board.id}
										onSelect={() => openBoard(board.id)}
										aria-current={board.id === selectedBoard?.id ? 'page' : undefined}
									>
										<span className='min-w-0 flex-1 truncate'>{board.name}</span>
										<span className='shrink-0 text-xs whitespace-nowrap text-muted-foreground'>
											{board.taskCount} задач
										</span>
									</DropdownMenuItem>
								))}
								{canManage && (
									<>
										<DropdownMenuSeparator />
										<DropdownMenuItem onSelect={() => setCreatingBoard(true)}>
											<Plus aria-hidden />
											Создать доску
										</DropdownMenuItem>
									</>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
						<span
							aria-hidden
							className='text-sm font-normal tracking-normal text-muted-foreground'
						>
							{taskCount ??
								formatBoardTaskCount(
									boardQuery.data?.columns.reduce(
										(total, column) => total + column.tasks.length,
										0,
									) ??
										selectedBoard?.taskCount ??
										0,
								)}
						</span>
					</span>
				}
				description={
					boardQuery.data?.board.description ||
					'Задачи проекта по этапам: от бэклога до готового результата.'
				}
				navigation={
					<nav
						aria-label='Хлебные крошки'
						className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'
					>
						<Link
							href={ROUTES.teams}
							className='hidden transition-colors hover:text-foreground sm:inline'
						>
							Команды
						</Link>
						<ChevronRight aria-hidden className='hidden size-4 sm:block' />
						<Link
							href={teamRoutes.projects(teamId)}
							className='hidden transition-colors hover:text-foreground sm:inline'
						>
							Проекты
						</Link>
						<ChevronRight aria-hidden className='hidden size-4 sm:block' />
						<Link
							href={teamRoutes.project(teamId, projectId)}
							className='inline-flex min-w-0 items-center gap-2 text-sm text-muted-foreground hover:text-foreground'
						>
							<ChevronLeft aria-hidden className='size-4 shrink-0 sm:hidden' />
							<span className='truncate'>{projectQuery.data?.name ?? 'Проект'}</span>
						</Link>
						<ChevronRight aria-hidden className='hidden size-4 sm:block' />
						<span aria-current='page' className='hidden text-foreground sm:inline'>
							Доска
						</span>
					</nav>
				}
			/>
		</>
	)

	return (
		<div className='flex h-full min-h-0 flex-col overflow-hidden bg-background text-foreground'>
			<div className='flex min-h-0 w-full flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 sm:gap-6 sm:px-6'>
				{(!selectedBoard || !boardQuery.data || hasError || isLoading) && renderHeader()}
				{hasError ? (
					<EmptyState
						headingLevel='h2'
						className='my-auto self-center'
						title='Не удалось загрузить доску'
						description='Попробуйте повторить запрос.'
						action={<Button onClick={retry}>Повторить</Button>}
					/>
				) : isLoading ? (
					<div
						role='status'
						aria-label='Загрузка доски'
						className='flex gap-4 overflow-hidden'
					>
						{Array.from({ length: 3 }, (_, index) => (
							<Skeleton key={index} className='h-80 w-[330px] shrink-0 rounded-xl' />
						))}
					</div>
				) : !selectedBoard ? (
					<EmptyState
						headingLevel='h2'
						className='my-auto self-center'
						title={
							boardId !== undefined ? 'Доска недоступна' : 'В проекте пока нет досок'
						}
						description={
							boardId !== undefined
								? 'Возможно, доска удалена или не относится к этому проекту. Выберите другую доску.'
								: 'Создайте доску, чтобы распределять задачи по колонкам.'
						}
						action={
							boardId !== undefined ? (
								<Link
									href={teamRoutes.project(teamId, projectId)}
									className='text-primary underline underline-offset-4'
								>
									К списку досок
								</Link>
							) : canManage ? (
								<Button onClick={() => setCreatingBoard(true)}>
									<Plus aria-hidden />
									Создать доску
								</Button>
							) : undefined
						}
					/>
				) : boardQuery.data ? (
					<ProjectBoardContent
						projectName={projectQuery.data?.name}
						key={JSON.stringify([teamId, projectId, selectedBoard.id])}
						canManage={canManage}
						view={boardQuery.data}
						renderHeader={renderHeader}
						teamId={teamId}
					/>
				) : null}
				<CreateBoardDialog
					projectName={projectQuery.data?.name}
					open={creatingBoard}
					teamId={teamId}
					projectId={projectId}
					onOpenChange={setCreatingBoard}
					onCreated={(board) =>
						router.push(teamRoutes.projectBoard(teamId, projectId, board.id))
					}
				/>
			</div>
		</div>
	)
}

function ProjectBoardPageView(props: ProjectBoardPageViewProps) {
	return (
		<ProjectBoardPage
			key={JSON.stringify([props.teamId, props.projectId, props.boardId])}
			{...props}
		/>
	)
}

export { ProjectBoardPageView }
