'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { TaskStatusSchema, type BoardView } from '@repo/types'
import { Button, ConfirmDialog, EmptyState, Skeleton, toast } from '@repo/ui'
import { ChevronRight, Plus } from '@repo/ui/icons'

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
import type { BoardTask, BoardTaskFormValues, BoardTaskMoveInput } from '../model/types'
import { findBoardTask } from '../model/utils'
import { Board } from './board'
import { BoardTaskDetailsDialog } from './board-task-details-dialog'
import { BoardTaskFormDialog } from './board-task-form-dialog'

interface ProjectBoardPageViewProps {
	teamId: string
	projectId: string
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
	const membersQuery = useTeamMemberOptions(teamId, taskForm !== null)
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
				error.statusCode === 409
					? 'Доска изменилась. Попробуйте переместить задачу ещё раз.'
					: 'Не удалось переместить задачу. Попробуйте ещё раз.',
			)
		},
	})
	const columns = useMemo(
		() => toBoardColumnsViewModel(view, assignees),
		[view, assignees],
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
	const isMutating = isSaving || deleting.isPending
	const openCreateForm = () => {
		if (crudBusy.current || moving.current || !createColumns.length) return
		setOpenedTaskId(null)
		setFormError(null)
		setTaskForm({ mode: 'create', task: null })
	}
	const handleSubmitTask = async (values: BoardTaskFormValues) => {
		if (!taskForm || crudBusy.current || moving.current) return
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
		if (!taskPendingDelete || crudBusy.current || moving.current) return
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
	const handleMoveTask = ({ taskId, toColumnId, toIndex }: BoardTaskMoveInput) => {
		if (moving.current || moveTask.isPending || crudBusy.current || isMutating) return
		const source = view.columns.find((column) =>
			column.tasks.some((task) => task.id === taskId),
		)
		const target = view.columns.find((column) => column.id === toColumnId)
		const task = source?.tasks.find((item) => item.id === taskId)
		if (!source || !target || !task) return
		const position = Math.min(
			Math.max(toIndex, 0),
			target.tasks.filter((item) => item.id !== taskId).length,
		)
		if (
			source.id === target.id &&
			source.tasks.findIndex((item) => item.id === taskId) === position
		)
			return
		moving.current = true
		void moveTask
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
				},
			})
			.catch(() => undefined)
			.finally(() => {
				moving.current = false
			})
	}

	if (columns.length === 0) {
		return (
			<>
				{renderHeader()}
				<EmptyState
					headingLevel='h2'
					className='my-auto self-center'
					title='На доске пока нет колонок'
					description='Добавьте колонки, чтобы распределять задачи по этапам.'
				/>
			</>
		)
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
			{!hasTasks && (
				<EmptyState
					headingLevel='h2'
					className='mx-auto'
					title='На доске пока нет задач'
					description='Создайте первую задачу, чтобы начать работу.'
				/>
			)}
			{moveTask.isPending && (
				<span role='status' className='sr-only'>
					Сохраняем положение задачи
				</span>
			)}
			<Board
				columns={columns}
				onOpenTask={setOpenedTaskId}
				onMoveTask={handleMoveTask}
				disableInteraction={moveTask.isPending || isMutating}
			/>
			<BoardTaskDetailsDialog
				task={taskForm || taskPendingDelete ? null : selectedTask}
				showActivity={false}
				actionsDisabled={moveTask.isPending || isMutating}
				onEditTask={(task) => {
					if (moving.current || crudBusy.current) return
					setFormError(null)
					setTaskForm({ mode: 'edit', task })
				}}
				onDeleteTask={(task) => {
					if (moving.current || crudBusy.current) return
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

function ProjectBoardPageView({ teamId, projectId }: ProjectBoardPageViewProps) {
	const projectQuery = useProjectDetail(teamId, projectId)
	const boardsQuery = useBoardsList(teamId, projectId)
	const selectedBoard =
		boardsQuery.data?.find((board) => board.isDefault) ?? boardsQuery.data?.[0]
	const boardQuery = useBoardQuery(teamId, projectId, selectedBoard?.id ?? '')
	const isLoading =
		boardsQuery.isPending || (Boolean(selectedBoard) && boardQuery.isPending)
	const hasError = boardsQuery.isError || (Boolean(selectedBoard) && boardQuery.isError)

	const retry = () => {
		if (boardsQuery.isError || !selectedBoard) void boardsQuery.refetch()
		else void boardQuery.refetch()
	}

	const renderHeader = (actions?: ReactNode) => (
		<PageHeader
			actions={actions}
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
						title='В проекте пока нет досок'
						description='После создания доски здесь появятся колонки и задачи.'
					/>
				) : boardQuery.data ? (
					<ProjectBoardContent
						key={JSON.stringify([teamId, projectId, selectedBoard.id])}
						view={boardQuery.data}
						renderHeader={renderHeader}
						teamId={teamId}
					/>
				) : null}
			</div>
		</div>
	)
}

export { ProjectBoardPageView }
