'use client'

import { useDeferredValue, useState, type FormEvent } from 'react'

import { Button, cn, ConfirmDialog, EmptyState } from '@repo/ui'
import { Plus } from '@repo/ui/icons'

import { BOARD_TYPE_OPTIONS } from '../model/constants'
import { useBoardStore } from '../model/store'
import type { BoardTask, BoardTaskFormValues } from '../model/types'
import {
	buildBoardAssigneeOptions,
	buildBoardAssignees,
	buildBoardStats,
	filterBoardColumns,
	findBoardTask,
	flattenBoardTasks,
	hasBoardActiveFilters,
} from '../model/utils'
import { Board } from './board'
import { BoardTaskDetailsDialog } from './board-task-details-dialog'
import { BoardTaskFormDialog } from './board-task-form-dialog'
import { BoardToolbar } from './board-toolbar'

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
	const setQuery = useBoardStore((state) => state.setQuery)
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
	const stats = buildBoardStats(columns)
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
		<div className='min-h-full bg-[radial-gradient(circle_at_top_left,rgba(76,110,245,0.12),transparent_34%),linear-gradient(180deg,color-mix(in_oklab,var(--background)_92%,white_8%),var(--background))] text-foreground'>
			<div className='mx-auto flex w-full max-w-[1760px] flex-col gap-3 px-4 py-3 md:px-6 lg:px-8'>
				<section className='overflow-hidden rounded-[22px] border border-border/70 bg-card/88 px-4 py-2.5 shadow-[0_18px_48px_-42px_rgba(15,23,42,0.4)] lg:px-5 lg:py-3'>
					<div className='space-y-2'>
						<div className='grid gap-2 xl:grid-cols-[220px_minmax(0,1fr)] xl:items-start xl:gap-3'>
							<div className='space-y-1'>
								<div className='flex flex-wrap items-start justify-between gap-3'>
									<div className='space-y-1'>
										<div className='flex flex-wrap items-center gap-2'>
											<h1 className='text-xl font-semibold tracking-[-0.03em] text-foreground lg:text-2xl'>
												{board.name}
											</h1>
											<div className='inline-flex w-fit rounded-full border border-border bg-background/70 px-2.5 py-1 text-[11px] text-muted-foreground'>
												{allTasks.length} задач
											</div>
										</div>
										<p className='text-[12px] text-muted-foreground'>
											{board.periodLabel}
										</p>
									</div>
									<Button
										type='button'
										size='sm'
										onClick={openCreateTaskForm}
										className='h-8 rounded-[12px] px-3 text-[12px]'
									>
										<Plus className='size-3.5' />
										Создать задачу
									</Button>
								</div>
							</div>

							<div className='grid gap-2 md:grid-cols-3'>
								{stats.map((stat) => (
									<div
										key={stat.label}
										className='rounded-[14px] border border-border/75 bg-background/72 px-3 py-1.5'
									>
										<p className='text-[9px] font-semibold tracking-[0.04em] text-muted-foreground uppercase'>
											{stat.label}
										</p>
										<div className='mt-0.5 flex items-end justify-between gap-2'>
											<p className='text-[17px] font-semibold tracking-[-0.04em] text-foreground'>
												{stat.value}
											</p>
											<p className='max-w-[160px] truncate text-right text-[9px] leading-4 text-muted-foreground'>
												{stat.helper}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>

						<div className='pt-1'>
							<BoardToolbar
								query={query}
								type={type}
								assignee={assignee}
								typeOptions={BOARD_TYPE_OPTIONS}
								assigneeOptions={assigneeOptions}
								hasActiveFilters={hasActiveFilters}
								onQueryChange={setQuery}
								onTypeChange={setType}
								onAssigneeChange={setAssignee}
								onReset={resetFilters}
							/>
						</div>

						<p
							className={cn(
								'text-[11px] leading-4 text-muted-foreground transition-opacity',
								!hasActiveFilters && 'opacity-0',
							)}
						>
							Во время фильтрации drag & drop временно отключён, чтобы не ломать порядок
							скрытых задач.
						</p>
					</div>
				</section>

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
