'use client'

import { useEffect, useRef, useState } from 'react'

import { formatTaskCode, type Task, type UpdateTask } from '@repo/types'
import {
	Button,
	cn,
	Collapsible,
	CollapsibleContent,
	Skeleton,
	toast,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
	useOverlayClose,
} from '@repo/ui'
import { Copy, Trash2, TriangleAlert } from '@repo/ui/icons'

import { useMe } from '@/shared/api/use-auth'
import { useDeleteTask, useTaskDetail, useUpdateTask } from '@/shared/api/use-tasks'
import { useTeamMemberOptions } from '@/shared/api/use-team-members'
import { isApiError } from '@/shared/lib/api/utils'

import { TASK_TYPE_OPTIONS } from '../model/form'
import { taskChoiceToneClasses, taskTypeChoices } from './task-choice-options'
import { TaskDetailsProperties } from './task-details-properties'
import { TaskDialog } from './task-dialog'
import { TaskEditDialog } from './task-edit-dialog'

interface TaskDetailsDialogProps {
	teamId: string
	projectId: string
	taskId: string
	projectName?: string
	boardName?: string
	onClose: () => void
	onPendingChange?: (pending: boolean) => void
}

function TaskIdentity({ task }: { task: Task }) {
	const type = taskTypeChoices[task.type]
	const TypeIcon = type.Icon
	const code = formatTaskCode(task.id)
	return (
		<>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type='button'
							variant='outline'
							size='sm'
							className='max-w-full gap-2 bg-muted/50 px-2 text-muted-foreground'
							aria-label='Скопировать код задачи'
							onClick={async () => {
								try {
									await navigator.clipboard.writeText(code)
									toast.success('Код задачи скопирован')
								} catch {
									toast.error('Не удалось скопировать код задачи')
								}
							}}
						>
							<span className='truncate font-mono font-normal'>{code}</span>
							<Copy aria-hidden className='size-4 shrink-0' />
						</Button>
					</TooltipTrigger>
					<TooltipContent sideOffset={8}>
						<p>Скопировать {code}</p>
						<p>ID: {task.id}</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
			<span
				className={cn(
					'inline-flex items-center gap-1.5 text-xs leading-4',
					taskChoiceToneClasses[type.tone],
				)}
			>
				<TypeIcon aria-hidden className='size-4 shrink-0' />
				{TASK_TYPE_OPTIONS.find((option) => option.value === task.type)?.label}
			</span>
		</>
	)
}

export function TaskDetailsDialog({
	teamId,
	projectId,
	taskId,
	projectName,
	boardName,
	onClose,
	onPendingChange,
}: TaskDetailsDialogProps) {
	const { open, close: closeOverlay, completeClose } = useOverlayClose(onClose)
	const query = useTaskDetail(teamId, projectId, taskId)
	const profile = useMe()
	const members = useTeamMemberOptions(teamId, true)
	const updating = useUpdateTask()
	const deleting = useDeleteTask()
	const [editing, setEditing] = useState(false)
	const [confirming, setConfirming] = useState(false)
	const [editBusy, setEditBusy] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [returnFocus] = useState(() =>
		typeof document !== 'undefined' && document.activeElement instanceof HTMLElement
			? document.activeElement
			: null,
	)
	const inFlight = useRef(false)
	const deleteTrigger = useRef<HTMLButtonElement>(null)
	const deleteCancel = useRef<HTMLButtonElement>(null)
	const busy = !open || updating.isPending || deleting.isPending || editBusy
	useEffect(() => {
		if (confirming) deleteCancel.current?.focus({ preventScroll: true })
	}, [confirming])
	useEffect(() => {
		onPendingChange?.(busy)
		return () => onPendingChange?.(false)
	}, [busy, onPendingChange])
	const task = query.data
	const role = members.data?.find((member) => member.userId === profile.data?.id)?.role
	const canDelete = role === 'ADMIN' || role === 'OWNER'
	const confirmingDeletion = confirming && canDelete && Boolean(task)
	const canEdit = Boolean(
		task && profile.data && (task.createdById === profile.data.id || canDelete),
	)
	const close = () => {
		if (!busy && !inFlight.current) void closeOverlay()
	}
	const report = (reason: unknown, fallback: string) => {
		const message = isApiError(reason) ? reason.message : fallback
		setError(message)
		toast.error(message)
	}
	const update = async (data: UpdateTask) => {
		if (!canEdit || inFlight.current || busy) return
		inFlight.current = true
		setError(null)
		try {
			await updating.mutateAsync({ teamId, projectId, taskId, data })
		} catch (reason) {
			report(reason, 'Не удалось обновить задачу. Повторите попытку.')
		} finally {
			inFlight.current = false
		}
	}
	const remove = async () => {
		if (!canDelete || inFlight.current || busy) return
		inFlight.current = true
		setError(null)
		try {
			await deleting.mutateAsync({ teamId, projectId, taskId })
			toast.success('Задача удалена')
			await closeOverlay()
		} catch (reason) {
			report(reason, 'Не удалось удалить задачу. Повторите попытку.')
		} finally {
			inFlight.current = false
		}
	}
	if (editing && task && canEdit)
		return (
			<TaskEditDialog
				key={task.id}
				teamId={teamId}
				projectId={projectId}
				task={task}
				returnFocus={returnFocus}
				onPendingChange={setEditBusy}
				onClose={() => setEditing(false)}
			/>
		)
	return (
		<TaskDialog
			open={open}
			onClosed={completeClose}
			title={task?.title ?? 'Задача'}
			description={
				[projectName, boardName].filter(Boolean).join(' / ') || 'Задача проекта'
			}
			headerMeta={task && <TaskIdentity task={task} />}
			pending={busy}
			onClose={close}
			returnFocus={returnFocus}
			footer={
				<footer
					className={cn(
						'min-w-0 border-t transition-colors duration-200 motion-reduce:transition-none',
						confirmingDeletion
							? 'border-destructive/30 bg-destructive/5'
							: 'border-border',
					)}
				>
					<Collapsible open={confirmingDeletion}>
						<CollapsibleContent
							aria-hidden={!confirmingDeletion}
							inert={!confirmingDeletion}
						>
							{task && canDelete && (
								<div
									role='group'
									aria-labelledby='task-delete-title'
									className='space-y-3 px-6 py-5 sm:px-7'
								>
									<h2
										id='task-delete-title'
										className='flex items-center gap-2 text-lg leading-7 font-semibold'
									>
										<TriangleAlert
											aria-hidden
											className='size-4 shrink-0 text-destructive'
										/>
										Удалить задачу {formatTaskCode(task.id)}?
									</h2>
									<p className='text-sm leading-5 text-muted-foreground'>
										«{task.title}» будет удалена
										{boardName ? ` с доски «${boardName}»` : ' из проекта'}. Подтвердите
										действие.
									</p>
									{error && (
										<p role='alert' className='text-sm text-destructive'>
											{error}
										</p>
									)}
									<div className='flex flex-wrap justify-end gap-2.5'>
										<Button
											ref={deleteCancel}
											type='button'
											variant='outline'
											size='lg'
											disabled={busy || !confirmingDeletion}
											onClick={() => {
												setConfirming(false)
												setError(null)
												requestAnimationFrame(() =>
													deleteTrigger.current?.focus({ preventScroll: true }),
												)
											}}
										>
											Отмена
										</Button>
										<Button
											type='button'
											variant='destructive'
											size='lg'
											disabled={busy || !confirmingDeletion}
											onClick={() => {
												void remove()
											}}
										>
											{deleting.isPending ? 'Удаляем…' : 'Удалить задачу'}
										</Button>
									</div>
								</div>
							)}
						</CollapsibleContent>
					</Collapsible>
					<Collapsible open={!confirmingDeletion}>
						<CollapsibleContent
							aria-hidden={confirmingDeletion}
							inert={confirmingDeletion}
						>
							<div className='flex min-w-0 flex-wrap items-center gap-3 px-6 py-5 sm:px-7'>
								{task && !query.isError && canDelete && (
									<Button
										ref={deleteTrigger}
										type='button'
										variant='ghost'
										size='lg'
										disabled={busy || confirmingDeletion}
										className='text-destructive hover:bg-destructive/10 hover:text-destructive'
										onClick={() => {
											setError(null)
											setConfirming(true)
										}}
									>
										<Trash2 aria-hidden className='size-4' />
										Удалить задачу
									</Button>
								)}
								<div className='ml-auto flex min-w-0 max-w-full flex-wrap justify-end gap-2.5'>
									<Button
										type='button'
										variant='outline'
										size='lg'
										disabled={busy || confirmingDeletion}
										onClick={close}
									>
										Закрыть
									</Button>
									{task && !query.isError && canEdit && (
										<Button
											type='button'
											size='lg'
											disabled={busy || confirmingDeletion}
											onClick={() => {
												setError(null)
												setEditing(true)
											}}
										>
											Редактировать задачу
										</Button>
									)}
								</div>
							</div>
						</CollapsibleContent>
					</Collapsible>
				</footer>
			}
		>
			<div className='min-h-0 min-w-0 overflow-y-auto px-6 py-7 sm:px-7'>
				{query.isPending ? (
					<div role='status' aria-label='Загрузка задачи' className='space-y-4'>
						<Skeleton className='h-6 w-1/2' />
						<Skeleton className='h-28 w-full' />
					</div>
				) : query.isError || !task ? (
					<div role='alert' className='space-y-3'>
						<p>
							{isApiError(query.error) && query.error.statusCode === 404
								? 'Задача не найдена.'
								: 'Не удалось загрузить задачу.'}
						</p>
						<Button
							variant='outline'
							onClick={() => {
								void query.refetch()
							}}
						>
							Повторить
						</Button>
					</div>
				) : (
					<div className='grid min-w-0 gap-7 xl:grid-cols-[minmax(0,1fr)_240px]'>
						<div className='min-w-0 space-y-6'>
							<section aria-labelledby='task-description-heading' className='space-y-2.5'>
								<h2
									id='task-description-heading'
									className='text-base leading-6 font-semibold'
								>
									Описание
								</h2>
								<p className='text-base leading-6 whitespace-pre-wrap break-words text-muted-foreground'>
									{task.description || 'Описание не добавлено.'}
								</p>
							</section>
							{error && !confirmingDeletion && (
								<p role='alert' className='text-sm text-destructive'>
									{error}
								</p>
							)}
						</div>
						<TaskDetailsProperties
							teamId={teamId}
							projectId={projectId}
							task={task}
							members={members.data ?? []}
							canEdit={canEdit}
							busy={busy || confirmingDeletion}
							onUpdate={(data) => {
								void update(data)
							}}
						/>
					</div>
				)}
			</div>
		</TaskDialog>
	)
}
