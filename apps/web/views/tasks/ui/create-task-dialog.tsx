'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'

import type { Priority, TaskStatus, TaskType } from '@repo/types'
import {
	Button,
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	toast,
	useMediaQuery,
} from '@repo/ui'

import { useCreateTask } from '@/shared/api/use-tasks'
import { useTeamMembers } from '@/shared/api/use-team-members'
import { teamRoutes } from '@/shared/config'
import { isApiError } from '@/shared/lib/api/utils'

import {
	AssigneeSelect,
	formInputClass,
	PriorityToggle,
	StatusSelect,
	TypeToggle,
} from '../lib/task-form'

const DESKTOP_QUERY = '(min-width: 768px)'

function FormFields({
	title,
	setTitle,
	description,
	setDescription,
	type,
	setType,
	priority,
	setPriority,
	status,
	setStatus,
	assigneeId,
	setAssigneeId,
	members,
}: {
	title: string
	setTitle: (v: string) => void
	description: string
	setDescription: (v: string) => void
	type: TaskType
	setType: (v: TaskType) => void
	priority: Priority
	setPriority: (v: Priority) => void
	status: TaskStatus
	setStatus: (v: TaskStatus) => void
	assigneeId: string
	setAssigneeId: (v: string) => void
	members: { userId: string; name: string | null }[]
}) {
	return (
		<div className='flex flex-col gap-5 overflow-y-auto px-4 py-4 sm:px-6'>
			<div className='flex flex-col gap-1.5'>
				<label className='text-[14px] font-medium'>
					Название <span className='text-destructive'>*</span>
				</label>
				<input
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder='Название задачи'
					autoFocus
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
	)
}

export function CreateTaskDialog() {
	const router = useRouter()
	const params = useParams<{ id: string; projectId: string }>()
	const teamId = decodeURIComponent(params.id)
	const projectId = decodeURIComponent(params.projectId)
	const isDesktop = useMediaQuery(DESKTOP_QUERY)

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

	function close() {
		router.replace(teamRoutes.projectTasks(teamId, projectId))
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
			close()
		} catch (error) {
			if (isApiError(error)) {
				toast.error(error.message)
				return
			}
			throw error
		}
	}

	const formFields = (
		<FormFields
			title={title}
			setTitle={setTitle}
			description={description}
			setDescription={setDescription}
			type={type}
			setType={setType}
			priority={priority}
			setPriority={setPriority}
			status={status}
			setStatus={setStatus}
			assigneeId={assigneeId}
			setAssigneeId={setAssigneeId}
			members={members}
		/>
	)

	const footerButtons = (
		<>
			<Button variant='outline' className='flex-1' onClick={close}>
				Отмена
			</Button>
			<Button
				className='flex-1 bg-primary text-primary-foreground hover:bg-primary/90'
				onClick={() => void handleSubmit()}
				disabled={!isValid || isPending}
			>
				{isPending ? 'Создание...' : 'Создать'}
			</Button>
		</>
	)

	if (isDesktop) {
		return (
			<Sheet open onOpenChange={(open) => !open && close()}>
				<SheetContent side='right' className='flex w-full flex-col sm:max-w-[480px]'>
					<SheetHeader className='px-6 pb-2 pt-6'>
						<SheetTitle className='text-[20px] font-semibold tracking-tight'>
							Создать задачу
						</SheetTitle>
						<SheetDescription>Заполните поля для создания новой задачи</SheetDescription>
					</SheetHeader>
					<div className='flex flex-1 flex-col overflow-hidden'>{formFields}</div>
					<SheetFooter className='flex gap-3 border-t border-border px-6 py-4'>
						{footerButtons}
					</SheetFooter>
				</SheetContent>
			</Sheet>
		)
	}

	return (
		<Drawer open onOpenChange={(open) => !open && close()}>
			<DrawerContent>
				<DrawerHeader className='text-left'>
					<DrawerTitle className='text-[18px] font-semibold'>Создать задачу</DrawerTitle>
					<DrawerDescription>Заполните поля для создания новой задачи</DrawerDescription>
				</DrawerHeader>
				{formFields}
				<DrawerFooter className='flex flex-row gap-3 border-t border-border pt-4'>
					{footerButtons}
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	)
}
