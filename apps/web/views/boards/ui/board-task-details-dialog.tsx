'use client'

import { useEffect, useState, type FormEvent } from 'react'

import {
	Avatar,
	AvatarFallback,
	Button,
	cn,
	DialogDrawer,
	DialogDrawerContent,
	DialogDrawerDescription,
	DialogDrawerFooter,
	DialogDrawerHeader,
	DialogDrawerTitle,
	Separator,
	Textarea,
	toast,
} from '@repo/ui'
import {
	Copy,
	History,
	MessageSquare,
	Pencil,
	Send,
	Tag,
	Trash2,
	UserRound,
} from '@repo/ui/icons'

import { TaskPriorityBadge, TaskTypeBadge } from '@/entities/task'

import { BOARD_COLUMN_TITLES, BOARD_PRIORITY_LABELS } from '../model/constants'
import type { BoardTask } from '../model/types'

const boardTaskDialogContentClassName = (isDesktop: boolean) =>
	isDesktop
		? 'max-h-[min(720px,calc(100dvh-2rem))] w-full overflow-hidden rounded-[var(--radius-surface)] border-border bg-card p-0 text-card-foreground shadow-lg sm:max-w-[980px]'
		: 'max-h-[80dvh] overflow-hidden border-border bg-card p-0 text-card-foreground'

type BoardTaskDialogPanel = 'comments' | 'history'

interface BoardTaskDetailsDialogProps {
	task: BoardTask | null
	commentDraft?: string
	isSubmitDisabled?: boolean
	readOnly?: boolean
	showActivity?: boolean
	actionsDisabled?: boolean
	onCommentDraftChange?: (value: string) => void
	onDeleteTask?: (task: BoardTask) => void
	onEditTask?: (task: BoardTask) => void
	onOpenChange: (open: boolean) => void
	onSubmitComment?: (event: FormEvent<HTMLFormElement>) => void
}

function BoardTaskDetailsDialog({
	task,
	commentDraft = '',
	isSubmitDisabled = true,
	readOnly = false,
	showActivity = !readOnly,
	actionsDisabled = false,
	onCommentDraftChange,
	onDeleteTask,
	onEditTask,
	onOpenChange,
	onSubmitComment = (event) => event.preventDefault(),
}: BoardTaskDetailsDialogProps) {
	const [activePanel, setActivePanel] = useState<BoardTaskDialogPanel>('comments')

	useEffect(() => {
		setActivePanel('comments')
	}, [task?.id])

	const handleCopyTaskKey = async () => {
		if (!task) {
			return
		}

		try {
			await navigator.clipboard.writeText(task.key)
			toast.success(`Ключ ${task.key} скопирован`)
		} catch {
			toast.error('Не удалось скопировать ключ задачи')
		}
	}

	const commentsCount = task?.comments.length ?? 0
	const historyCount = task?.history.length ?? 0
	const canEditTask = !readOnly && task !== null && onEditTask !== undefined
	const canDeleteTask = !readOnly && task !== null && onDeleteTask !== undefined

	return (
		<DialogDrawer open={task !== null} onOpenChange={onOpenChange}>
			<DialogDrawerContent className={boardTaskDialogContentClassName}>
				{task ? (
					<form
						onSubmit={onSubmitComment}
						className='grid max-h-[inherit] min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden'
					>
						<DialogDrawerHeader className='relative gap-0 px-5 pt-4 pb-0 sm:px-6 lg:px-7 lg:pt-5'>
							<div className='pr-14 sm:pr-18'>
								<div className='flex flex-wrap items-center gap-2.5'>
									<TaskTypeBadge type={task.type} />
									<span className='text-xs font-medium break-all text-muted-foreground'>
										{task.key}
									</span>
								</div>

								<DialogDrawerTitle className='mt-3 text-lg leading-7 font-semibold text-foreground'>
									{task.title}
								</DialogDrawerTitle>
								<DialogDrawerDescription className='sr-only'>
									{!showActivity
										? 'Детали задачи и описание.'
										: 'Детали задачи, описание, комментарии и история изменений.'}
								</DialogDrawerDescription>
								<div className='mt-3 flex flex-wrap gap-2'>
									{canEditTask ? (
										<Button
											type='button'
											variant='outline'
											size='sm'
											disabled={actionsDisabled}
											onClick={() => onEditTask?.(task)}
										>
											<Pencil className='size-4' />
											Редактировать
										</Button>
									) : null}
									{canDeleteTask ? (
										<Button
											type='button'
											variant='destructive'
											size='sm'
											disabled={actionsDisabled}
											onClick={() => onDeleteTask?.(task)}
										>
											<Trash2 className='size-4' />
											Удалить задачу
										</Button>
									) : null}
								</div>
							</div>

							<Button
								type='button'
								variant='outline'
								size='icon-lg'
								onClick={() => void handleCopyTaskKey()}
								className='absolute top-4 right-12'
								aria-label='Скопировать ключ задачи'
							>
								<Copy className='size-4' />
							</Button>
						</DialogDrawerHeader>

						<div className='flex min-h-0 flex-col overflow-y-auto px-5 py-3 sm:px-6'>
							<section className='grid gap-x-5 gap-y-2 sm:grid-cols-2 md:grid-cols-4'>
								<div>
									<p className='text-xs font-medium text-muted-foreground'>Статус</p>
									<p className='mt-0.5 text-[14px] font-semibold text-foreground'>
										{BOARD_COLUMN_TITLES[task.status]}
									</p>
								</div>

								<div>
									<p className='text-xs font-medium text-muted-foreground'>Приоритет</p>
									<div className='mt-1 inline-flex items-center gap-1.5 text-sm font-medium'>
										<TaskPriorityBadge priority={task.priority} />
										<span>{BOARD_PRIORITY_LABELS[task.priority]}</span>
									</div>
								</div>

								<div>
									<p className='text-xs font-medium text-muted-foreground'>Исполнитель</p>
									<div className='mt-0.5 inline-flex items-center gap-2'>
										<Avatar className='size-6 border border-border bg-muted'>
											<AvatarFallback className='bg-muted text-xs font-semibold text-foreground'>
												{task.assignee?.initials ?? '—'}
											</AvatarFallback>
										</Avatar>
										<span className='text-[14px] font-semibold text-foreground'>
											{task.assignee?.name ?? 'Без исполнителя'}
										</span>
									</div>
								</div>

								<div>
									<p className='text-xs font-medium text-muted-foreground'>Дедлайн</p>
									<p className='mt-0.5 text-[14px] font-medium text-foreground'>
										{task.dueDate?.slice(0, 10) ?? 'Не указан'}
									</p>
								</div>
							</section>

							{task.tags.length > 0 && (
								<div className='mt-3 flex flex-wrap items-center gap-1.5'>
									<span className='inline-flex size-6 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground'>
										<Tag className='size-4' />
									</span>
									{task.tags.map((tag) => (
										<span
											key={tag}
											className='rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground'
										>
											{tag}
										</span>
									))}
								</div>
							)}

							<Separator className='my-3 bg-muted' />

							<section className='mt-0.5 flex min-h-0 flex-1 flex-col'>
								<h3 className='text-lg font-semibold text-foreground'>Описание</h3>
								<p className='mt-2 max-w-none text-base leading-6 whitespace-pre-wrap break-words text-foreground'>
									{task.description || 'Описание не добавлено'}
								</p>
							</section>

							{showActivity && (
								<>
									<Separator className='my-3 bg-muted' />
									<section>
										<div className='inline-flex rounded-[14px] border border-border bg-muted p-1'>
											<button
												type='button'
												onClick={() => setActivePanel('comments')}
												className={cn(
													'inline-flex h-8.5 items-center gap-2 rounded-[10px] px-3 text-sm font-medium transition-colors',
													activePanel === 'comments'
														? 'bg-muted text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
														: 'text-muted-foreground hover:text-foreground',
												)}
											>
												<MessageSquare className='size-4' />
												<span>Комментарии ({commentsCount})</span>
											</button>
											<button
												type='button'
												onClick={() => setActivePanel('history')}
												className={cn(
													'inline-flex h-8.5 items-center gap-2 rounded-[10px] px-3 text-sm font-medium transition-colors',
													activePanel === 'history'
														? 'bg-muted text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
														: 'text-muted-foreground hover:text-foreground',
												)}
											>
												<History className='size-4' />
												<span>История ({historyCount})</span>
											</button>
										</div>

										<div className='mt-3 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1'>
											{activePanel === 'comments' ? (
												task.comments.length > 0 ? (
													task.comments.map((comment) => (
														<div
															key={comment.id}
															className='rounded-[14px] border border-border bg-muted px-3 py-2.5'
														>
															<div className='flex items-start gap-3'>
																<Avatar className='size-6.5 border border-border bg-muted'>
																	<AvatarFallback className='bg-muted text-xs font-semibold text-foreground'>
																		{comment.author.initials}
																	</AvatarFallback>
																</Avatar>
																<div className='min-w-0 flex-1'>
																	<div className='flex flex-wrap items-center gap-2'>
																		<span className='text-xs font-semibold text-foreground'>
																			{comment.author.name}
																		</span>
																		<span className='text-xs text-foreground0'>
																			{comment.createdAtLabel}
																		</span>
																	</div>
																	<p className='mt-0.5 text-[12px] leading-5 text-muted-foreground'>
																		{comment.content}
																	</p>
																</div>
															</div>
														</div>
													))
												) : (
													<div className='flex min-h-[88px] items-center justify-center rounded-[16px] px-4 text-center text-sm font-medium text-foreground0'>
														Комментариев нет
													</div>
												)
											) : task.history.length > 0 ? (
												task.history.map((entry) => (
													<div
														key={entry.id}
														className='rounded-[14px] border border-border bg-muted px-3 py-2.5'
													>
														<div className='flex items-start gap-3'>
															<span className='mt-0.5 inline-flex size-6.5 items-center justify-center rounded-full border border-slate-400/15 bg-muted text-muted-foreground'>
																<UserRound className='size-4' />
															</span>
															<div className='min-w-0 flex-1'>
																<div className='flex flex-wrap items-center gap-2'>
																	<span className='text-xs font-semibold text-foreground'>
																		{entry.actor?.name ?? 'Система'}
																	</span>
																	<span className='text-xs text-foreground0'>
																		{entry.createdAtLabel}
																	</span>
																</div>
																<p className='mt-0.5 text-[12px] leading-5 text-muted-foreground'>
																	{entry.action}
																</p>
															</div>
														</div>
													</div>
												))
											) : (
												<div className='flex min-h-[88px] items-center justify-center rounded-[16px] px-4 text-center text-sm font-medium text-foreground0'>
													История пока пуста
												</div>
											)}
										</div>
									</section>
								</>
							)}
						</div>

						{showActivity && activePanel === 'comments' ? (
							<DialogDrawerFooter className='border-t border-border px-5 py-2.5 sm:px-6 lg:px-7'>
								<div className='flex w-full items-end gap-2.5'>
									<Textarea
										id='task-comment'
										aria-label='Новый комментарий'
										value={commentDraft}
										onChange={(event) => onCommentDraftChange?.(event.target.value)}
										placeholder='Написать комментарий...'
										rows={1}
										className='min-h-[42px] max-h-[84px] flex-1 resize-y rounded-[14px] border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-foreground0 focus-visible:border-sky-500/50 focus-visible:ring-sky-500/20'
									/>
									<Button
										type='submit'
										disabled={isSubmitDisabled}
										size='icon-lg'
										className='size-10 shrink-0 rounded-[14px] bg-indigo-500 text-foreground shadow-[0_18px_40px_-20px_rgba(99,102,241,0.85)] hover:bg-indigo-400'
										aria-label='Отправить комментарий'
									>
										<Send className='size-4' />
									</Button>
								</div>
							</DialogDrawerFooter>
						) : null}
					</form>
				) : null}
			</DialogDrawerContent>
		</DialogDrawer>
	)
}

export { BoardTaskDetailsDialog }
