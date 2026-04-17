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
		? "max-h-[min(720px,calc(100vh-1.5rem))] w-[min(980px,calc(100vw-1.5rem))] max-w-[980px] sm:max-w-[980px] overflow-hidden rounded-[24px] border border-white/10 bg-[#0b1220] p-0 text-slate-50 shadow-[0_48px_140px_-52px_rgba(2,6,23,0.95)] [&_[data-slot='dialog-close']]:top-4 [&_[data-slot='dialog-close']]:right-4 [&_[data-slot='dialog-close']]:border-0 [&_[data-slot='dialog-close']]:bg-transparent [&_[data-slot='dialog-close']]:p-0 [&_[data-slot='dialog-close']]:text-slate-400 [&_[data-slot='dialog-close']]:opacity-100 [&_[data-slot='dialog-close']]:shadow-none [&_[data-slot='dialog-close']]:hover:bg-transparent [&_[data-slot='dialog-close']]:hover:text-white"
		: 'max-h-[80vh] overflow-hidden rounded-t-[24px] border border-white/10 bg-[#0b1220] p-0 text-slate-50'

const BOARD_TASK_PRIORITY_TEXT_CLASS_NAMES = {
	LOW: 'text-slate-300',
	MEDIUM: 'text-sky-400',
	HIGH: 'text-amber-300',
	CRITICAL: 'text-rose-400',
} as const

type BoardTaskDialogPanel = 'comments' | 'history'

interface BoardTaskDetailsDialogProps {
	task: BoardTask | null
	commentDraft: string
	isSubmitDisabled: boolean
	onCommentDraftChange: (value: string) => void
	onDeleteTask?: (task: BoardTask) => void
	onEditTask?: (task: BoardTask) => void
	onOpenChange: (open: boolean) => void
	onSubmitComment: (event: FormEvent<HTMLFormElement>) => void
}

function BoardTaskDetailsDialog({
	task,
	commentDraft,
	isSubmitDisabled,
	onCommentDraftChange,
	onDeleteTask,
	onEditTask,
	onOpenChange,
	onSubmitComment,
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
	const canEditTask = task !== null && onEditTask !== undefined
	const canDeleteTask = task !== null && onDeleteTask !== undefined

	return (
		<DialogDrawer open={task !== null} onOpenChange={onOpenChange}>
			<DialogDrawerContent className={boardTaskDialogContentClassName}>
				{task ? (
					<form
						onSubmit={onSubmitComment}
						className='grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden'
					>
						<DialogDrawerHeader className='relative gap-0 px-5 pt-4 pb-0 sm:px-6 lg:px-7 lg:pt-5'>
							<div className='pr-14 sm:pr-18'>
								<div className='flex flex-wrap items-center gap-2.5'>
									<TaskTypeBadge
										type={task.type}
										className='h-6 rounded-full border-white/10 bg-sky-500/18 px-2.5 text-[10px] font-semibold text-sky-100'
									/>
									<span className='text-[12px] font-medium tracking-[0.04em] text-slate-400'>
										{task.key}
									</span>
								</div>

								<DialogDrawerTitle className='mt-3 text-[18px] leading-[1.18] font-semibold tracking-[-0.025em] text-white sm:text-[19px] lg:max-w-[980px] lg:text-[20px]'>
									{task.title}
								</DialogDrawerTitle>
								<DialogDrawerDescription className='sr-only'>
									Детали задачи, описание, комментарии и история изменений.
								</DialogDrawerDescription>
								<div className='mt-3 flex flex-wrap gap-2'>
									{canEditTask ? (
										<Button
											type='button'
											variant='outline'
											size='sm'
											onClick={() => onEditTask?.(task)}
											className='h-8 rounded-[12px] border-sky-400/30 bg-sky-400/10 px-3 text-[12px] text-sky-100 hover:bg-sky-400/15 hover:text-white'
										>
											<Pencil className='size-3.5' />
											Редактировать
										</Button>
									) : null}
									{canDeleteTask ? (
										<Button
											type='button'
											variant='outline'
											size='sm'
											onClick={() => onDeleteTask?.(task)}
											className='h-8 rounded-[12px] border-rose-400/30 bg-rose-400/10 px-3 text-[12px] text-rose-100 hover:bg-rose-400/15 hover:text-white'
										>
											<Trash2 className='size-3.5' />
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
								className='absolute top-4 right-12 size-11 rounded-[18px] border-sky-500/70 bg-sky-500/8 text-slate-50 shadow-[0_0_0_1px_rgba(59,130,246,0.15)] hover:bg-sky-500/12 hover:text-white'
								aria-label='Скопировать ключ задачи'
							>
								<Copy className='size-4' />
							</Button>
						</DialogDrawerHeader>

						<div className='flex min-h-0 flex-col overflow-hidden px-5 py-3 sm:px-6 lg:px-7 lg:py-3.5'>
							<section className='grid gap-x-5 gap-y-2 sm:grid-cols-2 md:grid-cols-4'>
								<div>
									<p className='text-[11px] font-medium text-slate-400'>Статус</p>
									<p className='mt-0.5 text-[14px] font-semibold text-white'>
										{BOARD_COLUMN_TITLES[task.columnId]}
									</p>
								</div>

								<div>
									<p className='text-[11px] font-medium text-slate-400'>Приоритет</p>
									<div
										className={cn(
											'mt-0.5 inline-flex items-center gap-1.5 text-[14px] font-medium',
											BOARD_TASK_PRIORITY_TEXT_CLASS_NAMES[task.priority],
										)}
									>
										<TaskPriorityBadge priority={task.priority} />
										<span>{BOARD_PRIORITY_LABELS[task.priority]}</span>
									</div>
								</div>

								<div>
									<p className='text-[11px] font-medium text-slate-400'>Исполнитель</p>
									<div className='mt-0.5 inline-flex items-center gap-2'>
										<Avatar className='size-6 border border-white/10 bg-white/5'>
											<AvatarFallback className='bg-white/6 text-[10px] font-semibold text-slate-200'>
												{task.assignee.initials}
											</AvatarFallback>
										</Avatar>
										<span className='text-[14px] font-semibold text-white'>
											{task.assignee.name}
										</span>
									</div>
								</div>

								<div>
									<p className='text-[11px] font-medium text-slate-400'>Дедлайн</p>
									<p className='mt-0.5 text-[14px] font-medium text-white'>
										{task.deadline}
									</p>
								</div>
							</section>

							<div className='mt-3 flex flex-wrap items-center gap-1.5'>
								<span className='inline-flex size-6 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300'>
									<Tag className='size-3.25' />
								</span>
								{task.tags.map((tag) => (
									<span
										key={tag}
										className='rounded-full border border-white/8 bg-white/[0.05] px-2.5 py-1 text-[10px] font-medium text-slate-200'
									>
										{tag}
									</span>
								))}
							</div>

							<Separator className='my-3 bg-white/10' />

							<section className='mt-0.5 flex min-h-0 flex-1 flex-col'>
								<h3 className='text-[14px] font-semibold text-white'>Описание</h3>
								<p className='mt-2 max-w-none text-[13px] leading-6 text-slate-300'>
									{task.description}
								</p>
							</section>

							<Separator className='my-3 bg-white/10' />

							<section>
								<div className='inline-flex rounded-[14px] border border-white/10 bg-white/6 p-1'>
									<button
										type='button'
										onClick={() => setActivePanel('comments')}
										className={cn(
											'inline-flex h-8.5 items-center gap-2 rounded-[10px] px-3 text-[13px] font-medium transition-colors',
											activePanel === 'comments'
												? 'bg-[#0f1729] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
												: 'text-slate-400 hover:text-white',
										)}
									>
										<MessageSquare className='size-4' />
										<span>Комментарии ({commentsCount})</span>
									</button>
									<button
										type='button'
										onClick={() => setActivePanel('history')}
										className={cn(
											'inline-flex h-8.5 items-center gap-2 rounded-[10px] px-3 text-[13px] font-medium transition-colors',
											activePanel === 'history'
												? 'bg-[#0f1729] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
												: 'text-slate-400 hover:text-white',
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
													className='rounded-[14px] border border-white/8 bg-white/[0.04] px-3 py-2.5'
												>
													<div className='flex items-start gap-3'>
														<Avatar className='size-6.5 border border-white/10 bg-white/5'>
															<AvatarFallback className='bg-white/6 text-[10px] font-semibold text-slate-200'>
																{comment.author.initials}
															</AvatarFallback>
														</Avatar>
														<div className='min-w-0 flex-1'>
															<div className='flex flex-wrap items-center gap-2'>
																<span className='text-[11px] font-semibold text-white'>
																	{comment.author.name}
																</span>
																<span className='text-[10px] text-slate-500'>
																	{comment.createdAtLabel}
																</span>
															</div>
															<p className='mt-0.5 text-[12px] leading-5 text-slate-300'>
																{comment.content}
															</p>
														</div>
													</div>
												</div>
											))
										) : (
											<div className='flex min-h-[88px] items-center justify-center rounded-[16px] px-4 text-center text-[13px] font-medium text-slate-500'>
												Комментариев нет
											</div>
										)
									) : task.history.length > 0 ? (
										task.history.map((entry) => (
											<div
												key={entry.id}
												className='rounded-[14px] border border-white/8 bg-white/[0.04] px-3 py-2.5'
											>
												<div className='flex items-start gap-3'>
													<span className='mt-0.5 inline-flex size-6.5 items-center justify-center rounded-full border border-slate-400/15 bg-white/[0.05] text-slate-300'>
														<UserRound className='size-3.25' />
													</span>
													<div className='min-w-0 flex-1'>
														<div className='flex flex-wrap items-center gap-2'>
															<span className='text-[11px] font-semibold text-white'>
																{entry.actor?.name ?? 'Система'}
															</span>
															<span className='text-[10px] text-slate-500'>
																{entry.createdAtLabel}
															</span>
														</div>
														<p className='mt-0.5 text-[12px] leading-5 text-slate-300'>
															{entry.action}
														</p>
													</div>
												</div>
											</div>
										))
									) : (
										<div className='flex min-h-[88px] items-center justify-center rounded-[16px] px-4 text-center text-[13px] font-medium text-slate-500'>
											История пока пуста
										</div>
									)}
								</div>
							</section>
						</div>

						{activePanel === 'comments' ? (
							<DialogDrawerFooter className='border-t border-white/10 px-5 py-2.5 sm:px-6 lg:px-7'>
								<div className='flex w-full items-end gap-2.5'>
									<Textarea
										id='task-comment'
										aria-label='Новый комментарий'
										value={commentDraft}
										onChange={(event) => onCommentDraftChange(event.target.value)}
										placeholder='Написать комментарий...'
										rows={1}
										className='min-h-[42px] max-h-[84px] flex-1 resize-y rounded-[14px] border-white/10 bg-[#0a101c] px-3 py-2 text-[13px] text-slate-100 placeholder:text-slate-500 focus-visible:border-sky-500/50 focus-visible:ring-sky-500/20'
									/>
									<Button
										type='submit'
										disabled={isSubmitDisabled}
										size='icon-lg'
										className='size-10 shrink-0 rounded-[14px] bg-indigo-500 text-white shadow-[0_18px_40px_-20px_rgba(99,102,241,0.85)] hover:bg-indigo-400'
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
