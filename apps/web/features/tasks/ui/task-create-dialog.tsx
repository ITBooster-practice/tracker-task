'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { createTaskSchema, TaskStatusSchema } from '@repo/types'
import { toast, useOverlayClose } from '@repo/ui'

import { useCreateTask } from '@/shared/api/use-tasks'
import { useTeamMemberOptions } from '@/shared/api/use-team-members'
import { isApiError } from '@/shared/lib/api/utils'

import {
	taskFormDefaults,
	taskFormSchema,
	type TaskFormColumn,
	type TaskFormValues,
} from '../model/form'
import { TaskDialog } from './task-dialog'
import { TaskForm } from './task-form'

interface TaskCreateDialogProps {
	teamId: string
	projectId: string
	columns?: readonly TaskFormColumn[]
	initialColumnId?: string
	boardName?: string
	visibilityWarning?: string
	onPendingChange?: (pending: boolean) => void
	onClose: () => void
}

export function TaskCreateDialog({
	teamId,
	projectId,
	columns,
	initialColumnId,
	boardName,
	visibilityWarning,
	onPendingChange,
	onClose,
}: TaskCreateDialogProps) {
	const { open, close: closeOverlay, completeClose } = useOverlayClose(onClose)
	const inFlight = useRef(false)
	const [serverError, setServerError] = useState<string | null>(null)
	const initialColumn =
		columns?.find((column) => column.id === initialColumnId) ??
		columns?.find((column) => column.key === 'TODO') ??
		columns?.[0]
	const initialStatus = TaskStatusSchema.safeParse(initialColumn?.key)
	const status = initialStatus.success ? initialStatus.data : 'TODO'
	const form = useForm<TaskFormValues>({
		resolver: zodResolver(taskFormSchema),
		mode: 'onChange',
		defaultValues: {
			...taskFormDefaults(status),
			...(initialColumn && { boardColumnId: initialColumn.id }),
		},
	})
	const creation = useCreateTask()
	const members = useTeamMemberOptions(teamId, true)
	useEffect(() => {
		onPendingChange?.(creation.isPending)
		return () => onPendingChange?.(false)
	}, [creation.isPending, onPendingChange])
	const close = () => {
		if (!inFlight.current && !creation.isPending && !form.formState.isSubmitting)
			void closeOverlay()
	}
	const submit = async (values: TaskFormValues) => {
		if (!open || inFlight.current) return
		inFlight.current = true
		setServerError(null)
		try {
			const data = createTaskSchema.parse({
				...values,
				description: values.description || undefined,
				assigneeId: values.assigneeId ?? undefined,
				dueDate: values.dueDate ?? undefined,
			})
			await creation.mutateAsync({ teamId, projectId, data })
			toast.success('Задача создана')
			await closeOverlay()
		} catch (error) {
			const message = isApiError(error)
				? error.message
				: 'Не удалось создать задачу. Повторите попытку.'
			setServerError(message)
			toast.error(message)
		} finally {
			inFlight.current = false
		}
	}
	return (
		<TaskDialog
			open={open}
			onClosed={completeClose}
			variant='form'
			title='Создать задачу'
			description={
				boardName
					? `Новая задача на доске «${boardName}».`
					: 'Заполните поля для создания новой задачи.'
			}
			pending={!open || creation.isPending || form.formState.isSubmitting}
			onClose={close}
		>
			<TaskForm
				teamId={teamId}
				projectId={projectId}
				form={form}
				visibilityWarning={visibilityWarning}
				columns={columns}
				members={members.data ?? []}
				membersPending={members.isPending}
				membersError={members.isError}
				onRetryMembers={() => {
					void members.refetch()
				}}
				pending={!open || creation.isPending}
				serverError={serverError}
				onSubmit={submit}
				onCancel={close}
			/>
		</TaskDialog>
	)
}
