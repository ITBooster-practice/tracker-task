'use client'

import { useState } from 'react'

import type { Priority, TaskStatus, TaskType } from '@repo/types'
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle, toast } from '@repo/ui'

import { useCreateTask } from '@/shared/api/use-tasks'
import { useTeamMembers } from '@/shared/api/use-team-members'
import { isApiError } from '@/shared/lib/api/utils'

import {
	AssigneeSelect,
	formInputClass,
	PriorityToggle,
	StatusSelect,
	TypeToggle,
} from '../lib/task-form'

interface CreateTaskSheetProps {
	teamId: string
	projectId: string
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function CreateTaskSheet({
	teamId,
	projectId,
	open,
	onOpenChange,
}: CreateTaskSheetProps) {
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [type, setType] = useState<TaskType>('TASK')
	const [priority, setPriority] = useState<Priority>('MEDIUM')
	const [status, setStatus] = useState<TaskStatus>('TODO')
	const [assigneeId, setAssigneeId] = useState('')

	const { mutateAsync: createTask, isPending } = useCreateTask()
	const { data: membersData } = useTeamMembers(teamId)
	const members = membersData?.data ?? []

	const isValid = title.trim().length > 0

	function resetForm() {
		setTitle('')
		setDescription('')
		setType('TASK')
		setPriority('MEDIUM')
		setStatus('TODO')
		setAssigneeId('')
	}

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) resetForm()
		onOpenChange(nextOpen)
	}

	async function handleSubmit() {
		if (!isValid) return
		try {
			await createTask({
				teamId,
				projectId,
				data: {
					title: title.trim(),
					...(description.trim() && { description: description.trim() }),
					type,
					priority,
					status,
					...(assigneeId && { assigneeId }),
				},
			})
			toast.success('Задача создана')
			handleOpenChange(false)
		} catch (error) {
			if (isApiError(error)) {
				toast.error(error.message)
				return
			}
			throw error
		}
	}

	return (
		<Sheet open={open} onOpenChange={handleOpenChange}>
			<SheetContent side='right' className='flex w-full flex-col sm:max-w-[480px]'>
				<SheetHeader className='px-6 pb-2 pt-6'>
					<SheetTitle className='text-[20px] font-semibold tracking-tight'>
						Создать задачу
					</SheetTitle>
					<p className='text-[13px] text-muted-foreground'>
						Заполните поля для создания новой задачи
					</p>
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
							rows={3}
							className={`${formInputClass} resize-none`}
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
						onClick={() => handleOpenChange(false)}
					>
						Отмена
					</Button>
					<Button
						className='flex-1 bg-primary text-primary-foreground hover:bg-primary/90'
						onClick={() => void handleSubmit()}
						disabled={!isValid || isPending}
					>
						{isPending ? 'Создание...' : 'Создать'}
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	)
}
