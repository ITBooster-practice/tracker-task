'use client'

import { useEffect, useState } from 'react'

import type { Priority, Task, TaskStatus, TaskType } from '@repo/types'
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle, toast } from '@repo/ui'

import { useUpdateTask } from '@/shared/api/use-tasks'
import { useTeamMembers } from '@/shared/api/use-team-members'
import { isApiError } from '@/shared/lib/api/utils'

import {
	AssigneeSelect,
	formInputClass,
	PriorityToggle,
	StatusSelect,
	TypeToggle,
} from '../lib/task-form'

interface EditTaskDialogProps {
	teamId: string
	projectId: string
	task: Task | null
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function EditTaskDialog({
	teamId,
	projectId,
	task,
	open,
	onOpenChange,
}: EditTaskDialogProps) {
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [type, setType] = useState<TaskType>('TASK')
	const [priority, setPriority] = useState<Priority>('MEDIUM')
	const [status, setStatus] = useState<TaskStatus>('TODO')
	const [assigneeId, setAssigneeId] = useState('')

	const { mutateAsync: updateTask, isPending } = useUpdateTask()
	const { data: membersData } = useTeamMembers(teamId)
	const members = membersData?.data ?? []

	useEffect(() => {
		if (!task) return
		setTitle(task.title)
		setDescription(task.description ?? '')
		setType(task.type ?? 'TASK')
		setPriority(task.priority)
		setStatus(task.status)
		setAssigneeId(task.assigneeId ?? '')
	}, [task])

	const isValid = title.trim().length > 0

	async function handleSubmit() {
		if (!task || !isValid) return
		try {
			await updateTask({
				teamId,
				projectId,
				taskId: task.id,
				data: {
					title: title.trim(),
					description: description.trim() || undefined,
					type,
					priority,
					status,
					assigneeId: assigneeId || undefined,
				},
			})
			toast.success('Задача обновлена')
			onOpenChange(false)
		} catch (error) {
			if (isApiError(error)) {
				toast.error(error.message)
				return
			}
			throw error
		}
	}

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side='right' className='flex w-full flex-col sm:max-w-[520px]'>
				<SheetHeader className='px-6 pb-2 pt-6'>
					<SheetTitle className='text-[20px] font-semibold tracking-tight'>
						Редактировать задачу
					</SheetTitle>
					{task && (
						<p className='line-clamp-1 text-[13px] text-muted-foreground'>{task.title}</p>
					)}
				</SheetHeader>

				<div className='flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-4'>
					<div className='flex flex-col gap-1.5'>
						<label className='text-[14px] font-medium'>
							Название <span className='text-destructive'>*</span>
						</label>
						<input
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder='Название задачи'
							className={formInputClass}
						/>
					</div>

					<div className='flex flex-col gap-1.5'>
						<label className='text-[14px] font-medium'>Описание</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder='Описание задачи...'
							rows={4}
							className={`${formInputClass} resize-y`}
						/>
					</div>

					<TypeToggle value={type} onChange={setType} />
					<PriorityToggle value={priority} onChange={setPriority} />
					<StatusSelect value={status} onChange={setStatus} />
					<AssigneeSelect value={assigneeId} members={members} onChange={setAssigneeId} />
				</div>

				<div className='flex gap-3 border-t border-border px-6 py-4'>
					<Button
						variant='outline'
						className='flex-1'
						onClick={() => onOpenChange(false)}
					>
						Отмена
					</Button>
					<Button
						className='flex-1 bg-primary text-primary-foreground hover:bg-primary/90'
						onClick={() => void handleSubmit()}
						disabled={!isValid || isPending}
					>
						{isPending ? 'Сохранение...' : 'Сохранить'}
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	)
}
