'use client'

import { useEffect, useRef, useState } from 'react'

import type { Task, UpdateTask } from '@repo/types'
import { Button, cn, ConfirmDialog, Skeleton, toast } from '@repo/ui'
import { Copy, Trash2 } from '@repo/ui/icons'

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
	return (
		<>
			<Button
				type='button'
				variant='outline'
				size='sm'
				className='max-w-full gap-2 bg-muted/50 px-2 text-muted-foreground'
				aria-label='Скопировать ID задачи'
				title={task.id}
				onClick={async () => {
					try {
						await navigator.clipboard.writeText(task.id)
						toast.success('ID задачи скопирован')
					} catch {
						toast.error('Не удалось скопировать ID задачи')
					}
				}}
			>
				<span className='truncate font-mono font-normal'>{task.id}</span>
				<Copy aria-hidden className='size-4 shrink-0' />
			</Button>
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
	const busy = updating.isPending || deleting.isPending || editBusy
	useEffect(() => {
		onPendingChange?.(busy)
		return () => onPendingChange?.(false)
	}, [busy, onPendingChange])
	const task = query.data
	const role = members.data?.find((member) => member.userId === profile.data?.id)?.role
	const canDelete = role === 'ADMIN' || role === 'OWNER'
	const canEdit = Boolean(
		task && profile.data && (task.createdById === profile.data.id || canDelete),
	)
	const close = () => {
		if (!busy && !inFlight.current) onClose()
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
			onClose()
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
	if (confirming && task && canDelete)
		return (
			<ConfirmDialog
				open
				title='Удалить задачу?'
				description={`Задача «${task.title}» будет удалена из проекта. Это действие нельзя отменить.`}
				confirmLabel='Удалить'
				pendingLabel='Удаляем…'
				isPending={deleting.isPending}
				onConfirm={() => {
					void remove()
				}}
				onOpenChange={(open) => {
					if (!open && !inFlight.current) {
						setConfirming(false)
						setError(null)
					}
				}}
			>
				{error && (
					<p role='alert' className='text-sm text-destructive'>
						{error}
					</p>
				)}
			</ConfirmDialog>
		)
	return (
		<TaskDialog
			title={task?.title ?? 'Задача'}
			description={
				[projectName, boardName].filter(Boolean).join(' / ') || 'Задача проекта'
			}
			headerMeta={task && <TaskIdentity task={task} />}
			pending={busy}
			onClose={close}
			returnFocus={returnFocus}
			footer={
				<footer className='flex min-w-0 flex-wrap items-center gap-3 border-t border-border px-6 py-5 sm:px-7'>
					{task && !query.isError && canDelete && (
						<Button
							type='button'
							variant='ghost'
							size='lg'
							disabled={busy}
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
							disabled={busy}
							onClick={close}
						>
							Закрыть
						</Button>
						{task && !query.isError && canEdit && (
							<Button
								type='button'
								size='lg'
								disabled={busy}
								onClick={() => {
									setError(null)
									setEditing(true)
								}}
							>
								Редактировать задачу
							</Button>
						)}
					</div>
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
							{error && (
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
							busy={busy}
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
