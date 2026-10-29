'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { TaskStatusSchema, type BoardView } from '@repo/types'
import {
	Button,
	ConfirmDialog,
	EmptyState,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Skeleton,
	toast,
} from '@repo/ui'
import { ChevronRight, Plus } from '@repo/ui/icons'

import {
	useCreateBoardColumn,
	useDeleteBoardColumn,
	useReorderBoardColumns,
	useUpdateBoardColumn,
} from '@/shared/api/use-board-columns'
import { useBoardsList } from '@/shared/api/use-boards'
import { useProjectDetail } from '@/shared/api/use-projects'
import {
	useBoardQuery,
	useCreateTask,
	useDeleteTask,
	useMoveTask,
	useUpdateTask,
} from '@/shared/api/use-tasks'
import { useTeamMemberOptions } from '@/shared/api/use-team-members'
import { ROUTES, teamRoutes } from '@/shared/config'
import { isApiError } from '@/shared/lib/api/utils'
import { PageHeader } from '@/shared/ui/page-header'

import { toBoardColumnsViewModel } from '../model/adapters'
import { buildBoardLanes, laneColumns } from '../model/board-swimlanes'
import {
	filterProjectBoardColumns,
	fullBoardMovePosition,
	hasProjectBoardFilters,
	projectBoardAssigneeOptions,
} from '../model/project-board-filters'
import type { BoardTask, BoardTaskFormValues, BoardTaskMoveInput } from '../model/types'
import { useProjectBoardFilters } from '../model/use-project-board-filters'
import { findBoardTask } from '../model/utils'
import { Board } from './board'
import { BoardTaskDetailsDialog } from './board-task-details-dialog'
import { BoardTaskFormDialog } from './board-task-form-dialog'
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
	renderHeader,
}: {
	view: BoardView
	teamId: string
	renderHeader: (actions?: ReactNode) => ReactNode
}) {
	const [openedTaskId, setOpenedTaskId] = useState<string | null>(null)
	const [taskForm, setTaskForm] = useState<{
		mode: 'create' | 'edit'
		task: BoardTask | null
	} | null>(null)
	const [formError, setFormError] = useState<string | null>(null)
	const [taskPendingDelete, setTaskPendingDelete] = useState<BoardTask | null>(null)
	const [deleteError, setDeleteError] = useState<string | null>(null)
	const creating = useCreateTask()
	const updating = useUpdateTask()
	const deleting = useDeleteTask()
	const creatingColumn = useCreateBoardColumn()
	const updatingColumn = useUpdateBoardColumn()
	const deletingColumn = useDeleteBoardColumn()
	const reorderingColumns = useReorderBoardColumns()
	const columnBusy = useRef(false)
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
	const createColumns = useMemo(
		() =>
			columns.filter(
				(column) =>
					view.board.isDefault &&
					column.isSystem &&
					TaskStatusSchema.safeParse(column.key).success,
			),
		[columns, view.board.isDefault],
	)
	const isSaving = creating.isPending || updating.isPending
	const isMutating =
		isSaving ||
		deleting.isPending ||
		creatingColumn.isPending ||
		updatingColumn.isPending ||
		deletingColumn.isPending ||
		reorderingColumns.isPending
	const mutateColumn = async (action: () => Promise<unknown>) => {
		if (columnBusy.current || crudBusy.current || moving.current)
			throw new Error('Дождитесь завершения текущего действия.')
		columnBusy.current = true
		try {
			await action()
		} finally {
			columnBusy.current = false
		}
	}
	const columnContext = {
		teamId,
		projectId: view.board.projectId,
		boardId: view.board.id,
	}
	const handleCreateColumn = (title: string) =>
		mutateColumn(() =>
			creatingColumn.mutateAsync({
				...columnContext,
				data: { title, key: `column_${crypto.randomUUID()}` },
			}),
		)
	const handleRenameColumn = (columnId: string, title: string) =>
		mutateColumn(() =>
			updatingColumn.mutateAsync({ ...columnContext, columnId, data: { title } }),
		)
	const handleDeleteColumn = (columnId: string, targetColumnId: string) =>
		mutateColumn(() =>
			deletingColumn.mutateAsync({
				...columnContext,
				columnId,
				data: { targetColumnId },
			}),
		)
	const handleReorderColumns = (columnIds: string[]) =>
		mutateColumn(() =>
			reorderingColumns.mutateAsync({ ...columnContext, data: { columnIds } }),
		)
	const openCreateForm = () => {
		if (crudBusy.current || moving.current || columnBusy.current || !createColumns.length)
			return
		setOpenedTaskId(null)
		setFormError(null)
		setTaskForm({ mode: 'create', task: null })
	}
	const handleSubmitTask = async (values: BoardTaskFormValues) => {
		if (!taskForm || crudBusy.current || moving.current || columnBusy.current) return
		crudBusy.current = true
		setFormError(null)
		const data = {
			title: values.title,
			description: values.description,
			priority: values.priority,
			type: values.type,
		}
		try {
			if (taskForm.mode === 'create') {
				const column = createColumns.find((item) => item.id === values.boardColumnId)
				const status = TaskStatusSchema.safeParse(column?.key)
				if (!status.success) {
					setFormError('Выберите доступную колонку.')
					return
				}
				await creating.mutateAsync({
					teamId,
					projectId: view.board.projectId,
					data: {
						...data,
						status: status.data,
						...(values.assigneeId && { assigneeId: values.assigneeId }),
						...(values.dueDate && { dueDate: new Date(values.dueDate).toISOString() }),
					},
				})
			} else if (taskForm.task) {
				const task = taskForm.task
				await updating.mutateAsync({
					teamId,
					projectId: view.board.projectId,
					taskId: task.id,
					data: {
						...data,
						assigneeId: values.assigneeId || null,
						dueDate:
							values.dueDate === (task.dueDate?.slice(0, 10) ?? '')
								? task.dueDate
								: values.dueDate
									? new Date(values.dueDate).toISOString()
									: null,
					},
				})
			}
			if (mounted.current) setTaskForm(null)
		} catch (error) {
			if (mounted.current)
				setFormError(
					isApiError(error) && error.statusCode === 403
						? 'Недостаточно прав для изменения задачи.'
						: 'Не удалось сохранить задачу. Повторите попытку.',
				)
		} finally {
			crudBusy.current = false
		}
	}
	const handleDeleteTask = async () => {
		if (!taskPendingDelete || crudBusy.current || moving.current || columnBusy.current)
			return
		crudBusy.current = true
		setDeleteError(null)
		try {
			await deleting.mutateAsync({
				teamId,
				projectId: view.board.projectId,
				taskId: taskPendingDelete.id,
			})
			if (mounted.current) {
				setTaskPendingDelete(null)
				setOpenedTaskId(null)
			}
		} catch (error) {
			if (mounted.current)
				setDeleteError(
					isApiError(error) && error.statusCode === 403
						? 'Удаление доступно владельцу и администратору команды.'
						: 'Не удалось удалить задачу. Повторите попытку.',
				)
		} finally {
			crudBusy.current = false
		}
	}
	const selectedTask = findBoardTask(columns, openedTaskId)
	const hasTasks = columns.some((column) => column.tasks.length > 0)
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
			columnBusy.current ||
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
				createColumns.length > 0 ? (
					<>
						<Button onClick={openCreateForm} disabled={isMutating || moveTask.isPending}>
							<Plus aria-hidden='true' />
							Создать задачу
						</Button>
					</>
				) : undefined,
			)}
			<BoardToolbar
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
			{hasTasks && (
				<p className='text-sm text-muted-foreground' role='status' aria-live='polite'>
					Показано задач: {visibleTasks} из {totalTasks}
				</p>
			)}
			{hasTasks && visibleTasks === 0 && hasProjectBoardFilters(filters) && (
				<EmptyState
					headingLevel='h2'
					className='mx-auto'
					title='Задачи не найдены'
					description='Измените поиск или фильтры, чтобы увидеть задачи.'
					action={
						<Button variant='outline' onClick={clearFilters}>
							Показать все задачи
						</Button>
					}
				/>
			)}
			{columns.length === 0 && (
				<EmptyState
					headingLevel='h2'
					className='mx-auto'
					title='На доске пока нет колонок'
					description='Добавьте колонку, чтобы распределять задачи по этапам.'
				/>
			)}
			{columns.length > 0 && !hasTasks && (
				<EmptyState
					headingLevel='h2'
					className='mx-auto'
					title='На доске пока нет задач'
					description={
						view.board.isDefault
							? 'Создайте первую задачу, чтобы начать работу.'
							: 'Здесь будут отображаться задачи, добавленные на эту доску.'
					}
				/>
			)}
			{moveTask.isPending && (
				<span role='status' className='sr-only'>
					Сохраняем положение задачи
				</span>
			)}
			<Board
				grouping={grouping}
				lanes={lanes}
				columns={visibleColumns}
				onOpenTask={setOpenedTaskId}
				onMoveTask={handleMoveTask}
				disableInteraction={moveTask.isPending || isMutating || filtersPending}
				dragScope={dragScope}
				onCreateColumn={handleCreateColumn}
				onRenameColumn={handleRenameColumn}
				onDeleteColumn={handleDeleteColumn}
				onReorderColumns={handleReorderColumns}
				columnActionsDisabled={moveTask.isPending || isMutating}
			/>
			<BoardTaskDetailsDialog
				task={taskForm || taskPendingDelete ? null : selectedTask}
				showActivity={false}
				actionsDisabled={moveTask.isPending || isMutating}
				onEditTask={(task) => {
					if (moving.current || crudBusy.current || columnBusy.current) return
					setFormError(null)
					setTaskForm({ mode: 'edit', task })
				}}
				onDeleteTask={(task) => {
					if (moving.current || crudBusy.current || columnBusy.current) return
					setDeleteError(null)
					setTaskPendingDelete(task)
				}}
				onOpenChange={(open) => {
					if (!open) setOpenedTaskId(null)
				}}
			/>
			<BoardTaskFormDialog
				open={taskForm !== null}
				mode={taskForm?.mode ?? 'create'}
				task={taskForm?.task ?? null}
				columns={taskForm?.mode === 'edit' ? columns : createColumns}
				assignees={assignees}
				showTags={false}
				allowColumnChange={taskForm?.mode !== 'edit'}
				isPending={isSaving}
				error={formError}
				assigneesPending={membersQuery.isPending}
				assigneesError={membersQuery.isError}
				onRetryAssignees={() => {
					void membersQuery.refetch()
				}}
				onSubmit={(values) => {
					void handleSubmitTask(values)
				}}
				onOpenChange={(open) => {
					if (!open && !crudBusy.current) setTaskForm(null)
				}}
			/>
			<ConfirmDialog
				open={taskPendingDelete !== null}
				title='Удалить задачу?'
				description={`Задача «${taskPendingDelete?.title ?? ''}» будет удалена из проекта. Это действие нельзя отменить.`}
				confirmLabel='Удалить'
				pendingLabel='Удаляем…'
				isPending={deleting.isPending}
				onConfirm={handleDeleteTask}
				onOpenChange={(open) => {
					if (!open && !crudBusy.current) setTaskPendingDelete(null)
				}}
			>
				{deleteError && (
					<p role='alert' className='text-sm text-destructive'>
						{deleteError}
					</p>
				)}
			</ConfirmDialog>
		</>
	)
}

function ProjectBoardPage({ teamId, projectId, boardId }: ProjectBoardPageViewProps) {
	const router = useRouter()
	const openBoard = (id: string) => {
		const params = new URLSearchParams(window.location.search)
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

	const renderHeader = (actions?: ReactNode) => (
		<>
			<PageHeader
				actions={
					<>
						{actions}
						<Button variant='outline' onClick={() => setCreatingBoard(true)}>
							<Plus aria-hidden='true' />
							Создать доску
						</Button>
					</>
				}
				title={boardQuery.data?.board.name ?? selectedBoard?.name ?? 'Доска проекта'}
				description='Задачи проекта по этапам работы.'
				navigation={
					<nav
						aria-label='Хлебные крошки'
						className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'
					>
						<Link href={ROUTES.teams} className='transition-colors hover:text-foreground'>
							Команды
						</Link>
						<ChevronRight className='size-4' />
						<Link
							href={teamRoutes.projects(teamId)}
							className='transition-colors hover:text-foreground'
						>
							Проекты
						</Link>
						<ChevronRight className='size-4' />
						<Link
							href={teamRoutes.project(teamId, projectId)}
							className='text-sm text-muted-foreground hover:text-foreground'
						>
							{projectQuery.data?.name ?? 'Проект'}
						</Link>
						<ChevronRight className='size-4' />
						<span aria-current='page' className='text-foreground'>
							Доска
						</span>
					</nav>
				}
			/>
			{boardsQuery.data && boardsQuery.data.length > 0 && (
				<div className='w-full max-w-sm space-y-2'>
					<Label htmlFor='project-board-select'>Доска проекта</Label>
					<Select value={selectedBoard?.id ?? ''} onValueChange={openBoard}>
						<SelectTrigger id='project-board-select' className='w-full'>
							<SelectValue placeholder='Выберите доску' />
						</SelectTrigger>
						<SelectContent>
							{boardsQuery.data.map((board) => (
								<SelectItem key={board.id} value={board.id}>
									{board.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			)}
		</>
	)

	return (
		<div className='flex min-h-full flex-col bg-background text-foreground'>
			<div className='mx-auto flex w-full max-w-[1760px] flex-1 flex-col gap-6 px-4 py-5 sm:px-6'>
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
							<Skeleton key={index} className='h-80 w-[260px] shrink-0 rounded-xl' />
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
							) : undefined
						}
					/>
				) : boardQuery.data ? (
					<ProjectBoardContent
						key={JSON.stringify([teamId, projectId, selectedBoard.id])}
						view={boardQuery.data}
						renderHeader={renderHeader}
						teamId={teamId}
					/>
				) : null}
				<CreateBoardDialog
					open={creatingBoard}
					teamId={teamId}
					projectId={projectId}
					onOpenChange={setCreatingBoard}
					onCreated={(board) => openBoard(board.id)}
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
