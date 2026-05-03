'use client'

import { useDeferredValue, useState, type FormEvent } from 'react'

import {
	Button,
	ConfirmDialog,
	EmptyState,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@repo/ui'

import { BOARD_TYPE_OPTIONS } from '../model/constants'
import { useBoardStore } from '../model/store'
import type { BoardTask, BoardTaskFormValues } from '../model/types'
import {
	buildBoardAssigneeOptions,
	buildBoardAssignees,
	filterBoardColumns,
	findBoardTask,
	flattenBoardTasks,
	hasBoardActiveFilters,
} from '../model/utils'
import { Board } from './board'
import { BoardTaskDetailsDialog } from './board-task-details-dialog'
import { BoardTaskFormDialog } from './board-task-form-dialog'

type BoardTaskFormMode = 'create' | 'edit'

const DELETE_TASK_CONFIRM_TEXT = {
	title: 'Удалить задачу?',
	description: 'Карточка исчезнет с доски сразу после подтверждения.',
	confirm: 'Удалить',
	cancel: 'Отмена',
} as const

function BoardsPageView() {
	const board = useBoardStore((state) => state.board)
	const columns = useBoardStore((state) => state.columns)
	const query = useBoardStore((state) => state.query)
	const type = useBoardStore((state) => state.type)
	const assignee = useBoardStore((state) => state.assignee)
	const openedTaskId = useBoardStore((state) => state.openedTaskId)
	const commentDraft = useBoardStore((state) => state.commentDraft)
	const setType = useBoardStore((state) => state.setType)
	const setAssignee = useBoardStore((state) => state.setAssignee)
	const resetFilters = useBoardStore((state) => state.resetFilters)
	const moveTask = useBoardStore((state) => state.moveTask)
	const openTask = useBoardStore((state) => state.openTask)
	const closeTask = useBoardStore((state) => state.closeTask)
	const setCommentDraft = useBoardStore((state) => state.setCommentDraft)
	const submitComment = useBoardStore((state) => state.submitComment)
	const createTask = useBoardStore((state) => state.createTask)
	const updateTask = useBoardStore((state) => state.updateTask)
	const deleteTask = useBoardStore((state) => state.deleteTask)
	const [taskFormMode, setTaskFormMode] = useState<BoardTaskFormMode>('create')
	const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
	const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)
	const [taskPendingDelete, setTaskPendingDelete] = useState<BoardTask | null>(null)

	const deferredQuery = useDeferredValue(query)
	const allTasks = flattenBoardTasks(columns)
	const visibleColumns = filterBoardColumns(columns, {
		query: deferredQuery,
		type,
		assignee,
	})
	const visibleTasksCount = flattenBoardTasks(visibleColumns).length
	const assigneeOptions = buildBoardAssigneeOptions(allTasks)
	const assignees = buildBoardAssignees(allTasks)
	const selectedTask = findBoardTask(columns, openedTaskId)
	const editingTask = findBoardTask(columns, editingTaskId)
	const hasActiveFilters = hasBoardActiveFilters({
		query,
		type,
		assignee,
	})

	const handleSubmitComment = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		submitComment()
	}

	const openCreateTaskForm = () => {
		setTaskFormMode('create')
		setEditingTaskId(null)
		setIsTaskFormOpen(true)
	}

	const openEditTaskForm = (task: BoardTask) => {
		setTaskFormMode('edit')
		setEditingTaskId(task.id)
		closeTask()
		setIsTaskFormOpen(true)
	}

	const handleSubmitTaskForm = (values: BoardTaskFormValues) => {
		if (taskFormMode === 'create') {
			createTask(values)
		} else if (editingTaskId) {
			updateTask(editingTaskId, values)
		}

		setIsTaskFormOpen(false)
		setEditingTaskId(null)
	}

	const handleConfirmDeleteTask = () => {
		if (!taskPendingDelete) {
			return
		}

		deleteTask(taskPendingDelete.id)
		setTaskPendingDelete(null)
	}

	return (
		<div className='flex min-h-full flex-col bg-[radial-gradient(circle_at_top_left,rgba(76,110,245,0.12),transparent_34%),linear-gradient(180deg,color-mix(in_oklab,var(--background)_92%,white_8%),var(--background))] text-foreground'>
			<div className='mx-auto flex w-full max-w-[1760px] flex-1 flex-col px-4 py-3 md:px-6 lg:px-8'>
				<header className='mb-4 flex items-center justify-between gap-4'>
					<div>
						<h1 className='text-[18px] font-semibold tracking-[-0.02em] text-foreground'>
							{board.name}
						</h1>
						<p className='text-[11px] text-muted-foreground'>{board.projectName}</p>
					</div>

					<div className='flex items-center gap-2'>
						<Select value={type} onValueChange={(value) => setType(value as typeof type)}>
							<SelectTrigger
								size='sm'
								className='h-8 w-[130px] bg-background text-[12px]'
							>
								<SelectValue placeholder='Все типы' />
							</SelectTrigger>
							<SelectContent className='border-border bg-popover'>
								{BOARD_TYPE_OPTIONS.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select
							value={assignee}
							onValueChange={(value) => setAssignee(value as typeof assignee)}
						>
							<SelectTrigger
								size='sm'
								className='h-8 w-[140px] bg-background text-[12px]'
							>
								<SelectValue placeholder='Все исполнители' />
							</SelectTrigger>
							<SelectContent className='border-border bg-popover'>
								{assigneeOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{hasActiveFilters && (
							<Button
								type='button'
								variant='ghost'
								size='sm'
								onClick={resetFilters}
								className='h-8 px-3 text-[12px] text-muted-foreground hover:text-foreground'
							>
								Сбросить
							</Button>
						)}
					</div>
				</header>

				{visibleTasksCount === 0 ? (
					<EmptyState
						title='По этим фильтрам ничего не нашлось'
						description='Сбросьте фильтры или попробуйте другой запрос, чтобы снова увидеть карточки доски.'
						action={
							<Button variant='outline' onClick={resetFilters}>
								Сбросить фильтры
							</Button>
						}
						className='rounded-[28px] border-border bg-card/88 py-12 shadow-[0_18px_48px_-44px_rgba(15,23,42,0.55)]'
					/>
				) : (
					<Board
						columns={visibleColumns}
						onOpenTask={openTask}
						onMoveTask={moveTask}
						onCreateTask={openCreateTaskForm}
						disableInteraction={hasActiveFilters}
					/>
				)}

				<BoardTaskDetailsDialog
					task={selectedTask}
					commentDraft={commentDraft}
					isSubmitDisabled={commentDraft.trim().length === 0}
					onCommentDraftChange={setCommentDraft}
					onOpenChange={(open) => {
						if (!open) {
							closeTask()
						}
					}}
					onDeleteTask={setTaskPendingDelete}
					onEditTask={openEditTaskForm}
					onSubmitComment={handleSubmitComment}
				/>

				<BoardTaskFormDialog
					open={isTaskFormOpen}
					mode={taskFormMode}
					task={taskFormMode === 'edit' ? editingTask : null}
					assignees={assignees}
					onOpenChange={(open) => {
						setIsTaskFormOpen(open)

						if (!open) {
							setEditingTaskId(null)
						}
					}}
					onSubmit={handleSubmitTaskForm}
				/>

				<ConfirmDialog
					open={taskPendingDelete !== null}
					onOpenChange={(open) => {
						if (!open) {
							setTaskPendingDelete(null)
						}
					}}
					title={DELETE_TASK_CONFIRM_TEXT.title}
					description={
						taskPendingDelete
							? `${DELETE_TASK_CONFIRM_TEXT.description} ${taskPendingDelete.key}: ${taskPendingDelete.title}`
							: DELETE_TASK_CONFIRM_TEXT.description
					}
					confirmLabel={DELETE_TASK_CONFIRM_TEXT.confirm}
					cancelLabel={DELETE_TASK_CONFIRM_TEXT.cancel}
					onConfirm={handleConfirmDeleteTask}
				/>
			</div>
		</div>
	)
}

export { BoardsPageView }
