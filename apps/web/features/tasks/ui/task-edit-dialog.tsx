'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { updateTaskSchema, type Task } from '@repo/types'
import { toast, useOverlayClose } from '@repo/ui'

import { useUpdateTask } from '@/shared/api/use-tasks'
import { useTeamMemberOptions } from '@/shared/api/use-team-members'
import { isApiError } from '@/shared/lib/api/utils'

import {
	taskEditDefaults,
	taskFormSchema,
	taskUpdateData,
	type TaskFormValues,
} from '../model/form'
import { useTaskBoardColumns } from '../model/use-task-board-columns'
import { TaskDialog } from './task-dialog'
import { TaskForm } from './task-form'

interface TaskEditDialogProps {
	teamId: string
	projectId: string
	task: Task
	onClose: () => void
	onPendingChange?: (pending: boolean) => void
	returnFocus?: HTMLElement | null
}

export function TaskEditDialog({
	teamId,
	projectId,
	task,
	onClose,
	onPendingChange,
	returnFocus,
}: TaskEditDialogProps) {
	const { open, close: closeOverlay, completeClose } = useOverlayClose(onClose)
	const [initialTask] = useState(task)
	const form = useForm<TaskFormValues>({
		resolver: zodResolver(taskFormSchema),
		mode: 'onChange',
		defaultValues: taskEditDefaults(initialTask),
	})
	const mutation = useUpdateTask()
	const members = useTeamMemberOptions(teamId, true)
	const columns = useTaskBoardColumns(teamId, projectId, task.boardColumnId)
	const inFlight = useRef(false)
	const [serverError, setServerError] = useState<string | null>(null)
	useEffect(() => {
		onPendingChange?.(mutation.isPending)
		return () => onPendingChange?.(false)
	}, [mutation.isPending, onPendingChange])
	const close = () => {
		if (!inFlight.current && !mutation.isPending && !form.formState.isSubmitting)
			void closeOverlay()
	}
	const submit = async (values: TaskFormValues) => {
		if (!open || inFlight.current) return
		if (columns.isPending || columns.error) return
		if (!columns.columns.some((column) => column.id === values.boardColumnId)) {
			setServerError('Выбранная колонка недоступна. Выберите другую колонку.')
			return
		}
		inFlight.current = true
		setServerError(null)
		try {
			const data = updateTaskSchema.parse(taskUpdateData(initialTask, values))
			if (Object.keys(data).length) {
				await mutation.mutateAsync({ teamId, projectId, taskId: task.id, data })
				toast.success('Задача обновлена')
			}
			await closeOverlay()
		} catch (error) {
			const message = isApiError(error)
				? error.message
				: 'Не удалось сохранить задачу. Повторите попытку.'
			setServerError(message)
			toast.error(message)
			if (isApiError(error) && (error.statusCode === 404 || error.statusCode === 409))
				void columns.refetch()
		} finally {
			inFlight.current = false
		}
	}
	return (
		<TaskDialog
			open={open}
			onClosed={completeClose}
			variant='form'
			title='Редактировать задачу'
			description={initialTask.title}
			pending={!open || mutation.isPending || form.formState.isSubmitting}
			onClose={close}
			returnFocus={returnFocus}
		>
			<TaskForm
				teamId={teamId}
				projectId={projectId}
				mode='edit'
				form={form}
				columns={columns.columns}
				columnsPending={columns.isPending}
				columnsError={columns.error}
				onRetryColumns={() => {
					void columns.refetch()
				}}
				members={members.data ?? []}
				membersPending={members.isPending}
				membersError={members.isError}
				onRetryMembers={() => {
					void members.refetch()
				}}
				pending={!open || mutation.isPending}
				serverError={serverError}
				onSubmit={submit}
				onCancel={close}
			/>
		</TaskDialog>
	)
}
