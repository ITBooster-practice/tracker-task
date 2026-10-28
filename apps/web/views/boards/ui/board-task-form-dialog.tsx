'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'

import {
	Button,
	DialogDrawer,
	DialogDrawerContent,
	DialogDrawerDescription,
	DialogDrawerFooter,
	DialogDrawerHeader,
	DialogDrawerTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from '@repo/ui'

import { BOARD_PRIORITY_LABELS } from '../model/constants'
import type {
	BoardAssignee,
	BoardColumn,
	BoardColumnId,
	BoardTask,
	BoardTaskFormValues,
} from '../model/types'

type BoardTaskFormMode = 'create' | 'edit'

interface BoardTaskFormDialogProps {
	open: boolean
	mode: BoardTaskFormMode
	task: BoardTask | null
	columns: readonly Pick<BoardColumn, 'id' | 'key' | 'title'>[]
	assignees: BoardAssignee[]
	onOpenChange: (open: boolean) => void
	onSubmit: (values: BoardTaskFormValues) => void
}

interface BoardTaskFormState {
	title: string
	description: string
	boardColumnId: BoardColumnId
	priority: BoardTask['priority']
	assigneeId: string
	dueDate: string
	tags: string
}

const DEFAULT_TASK_FORM_STATE: BoardTaskFormState = {
	title: '',
	description: '',
	boardColumnId: '',
	priority: 'MEDIUM',
	assigneeId: '',
	dueDate: '',
	tags: '',
}

const TASK_FORM_TEXT = {
	createTitle: 'Создать задачу',
	editTitle: 'Редактировать задачу',
	createDescription: 'Новая задача будет добавлена на доску локально.',
	editDescription: 'Изменения применятся к карточке сразу после сохранения.',
	createSubmit: 'Создать',
	editSubmit: 'Сохранить',
	cancel: 'Отмена',
	title: 'Название',
	description: 'Описание',
	status: 'Колонка',
	priority: 'Приоритет',
	assignee: 'Исполнитель',
	dueDate: 'Дедлайн',
	tags: 'Теги',
} as const

const TASK_PRIORITY_OPTIONS = (
	Object.entries(BOARD_PRIORITY_LABELS) as Array<[BoardTask['priority'], string]>
).map(([value, label]) => ({
	value,
	label,
}))

const getInitialFormState = (
	task: BoardTask | null,
	assignees: BoardAssignee[],
	columns: BoardTaskFormDialogProps['columns'],
): BoardTaskFormState => {
	if (task) {
		return {
			title: task.title,
			description: task.description ?? '',
			boardColumnId: task.boardColumnId,
			priority: task.priority,
			assigneeId: task.assigneeId ?? '',
			dueDate: task.dueDate?.slice(0, 10) ?? '',
			tags: task.tags.join(', '),
		}
	}

	return {
		...DEFAULT_TASK_FORM_STATE,
		boardColumnId:
			columns.find((column) => column.key === 'TODO')?.id ?? columns[0]?.id ?? '',
		assigneeId: assignees[0]?.id ?? '',
	}
}

const normalizeTags = (value: string) =>
	value
		.split(',')
		.map((tag) => tag.trim())
		.filter(Boolean)

function BoardTaskFormDialog({
	open,
	mode,
	task,
	columns,
	assignees,
	onOpenChange,
	onSubmit,
}: BoardTaskFormDialogProps) {
	const [formState, setFormState] = useState<BoardTaskFormState>(() =>
		getInitialFormState(task, assignees, columns),
	)

	useEffect(() => {
		if (!open) {
			return
		}

		setFormState(getInitialFormState(task, assignees, columns))
	}, [assignees, columns, open, task])

	const isCreateMode = mode === 'create'
	const isSubmitDisabled =
		formState.title.trim().length === 0 ||
		!columns.some((column) => column.id === formState.boardColumnId)

	const selectedStatusLabel = useMemo(
		() => columns.find((column) => column.id === formState.boardColumnId)?.title,
		[columns, formState.boardColumnId],
	)
	const selectedPriorityLabel = BOARD_PRIORITY_LABELS[formState.priority]
	const selectedAssigneeLabel =
		assignees.find((assignee) => assignee.id === formState.assigneeId)?.name ??
		'Без исполнителя'

	const updateField = <Field extends keyof BoardTaskFormState>(
		field: Field,
		value: BoardTaskFormState[Field],
	) => {
		setFormState((currentState) => ({
			...currentState,
			[field]: value,
		}))
	}

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		if (isSubmitDisabled) {
			return
		}

		onSubmit({
			title: formState.title.trim(),
			description: formState.description.trim(),
			boardColumnId: formState.boardColumnId,
			priority: formState.priority,
			assigneeId: formState.assigneeId,
			dueDate: formState.dueDate,
			tags: normalizeTags(formState.tags),
		})
	}

	return (
		<DialogDrawer open={open} onOpenChange={onOpenChange}>
			<DialogDrawerContent className='max-h-[min(760px,calc(100vh-1.5rem))] overflow-hidden rounded-[24px] border-border bg-card p-0 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.8)] sm:max-w-[680px]'>
				<form
					onSubmit={handleSubmit}
					className='grid max-h-[inherit] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden'
				>
					<DialogDrawerHeader className='px-5 pt-5 pb-3 text-left sm:px-6'>
						<DialogDrawerTitle className='text-[20px] font-semibold tracking-tight'>
							{isCreateMode ? TASK_FORM_TEXT.createTitle : TASK_FORM_TEXT.editTitle}
						</DialogDrawerTitle>
						<DialogDrawerDescription className='text-[13px] leading-5'>
							{isCreateMode
								? TASK_FORM_TEXT.createDescription
								: TASK_FORM_TEXT.editDescription}
						</DialogDrawerDescription>
					</DialogDrawerHeader>

					<div className='min-h-0 space-y-4 overflow-y-auto px-5 py-2 sm:px-6'>
						<div className='space-y-2'>
							<Label htmlFor='board-task-title'>{TASK_FORM_TEXT.title}</Label>
							<Input
								id='board-task-title'
								value={formState.title}
								onChange={(event) => updateField('title', event.target.value)}
								placeholder='Например, подготовить релизный checklist'
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='board-task-description'>{TASK_FORM_TEXT.description}</Label>
							<Textarea
								id='board-task-description'
								value={formState.description}
								onChange={(event) => updateField('description', event.target.value)}
								rows={4}
								placeholder='Кратко опишите контекст и ожидаемый результат'
								className='min-h-[112px] resize-y'
							/>
						</div>

						<div className='grid gap-4 sm:grid-cols-2'>
							<div className='space-y-2'>
								<Label>{TASK_FORM_TEXT.status}</Label>
								<Select
									value={formState.boardColumnId}
									onValueChange={(value) =>
										updateField('boardColumnId', value as BoardColumnId)
									}
								>
									<SelectTrigger>
										<SelectValue placeholder={selectedStatusLabel} />
									</SelectTrigger>
									<SelectContent>
										{columns.map((column) => (
											<SelectItem key={column.id} value={column.id}>
												{column.title}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className='space-y-2'>
								<Label>{TASK_FORM_TEXT.priority}</Label>
								<Select
									value={formState.priority}
									onValueChange={(value) =>
										updateField('priority', value as BoardTask['priority'])
									}
								>
									<SelectTrigger>
										<SelectValue placeholder={selectedPriorityLabel} />
									</SelectTrigger>
									<SelectContent>
										{TASK_PRIORITY_OPTIONS.map((priority) => (
											<SelectItem key={priority.value} value={priority.value}>
												{priority.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className='space-y-2'>
								<Label>{TASK_FORM_TEXT.assignee}</Label>
								<Select
									value={formState.assigneeId || '__unassigned__'}
									onValueChange={(value) =>
										updateField('assigneeId', value === '__unassigned__' ? '' : value)
									}
								>
									<SelectTrigger>
										<SelectValue placeholder={selectedAssigneeLabel} />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='__unassigned__'>Без исполнителя</SelectItem>
										{assignees.map((assignee) => (
											<SelectItem key={assignee.id} value={assignee.id}>
												{assignee.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='board-task-dueDate'>{TASK_FORM_TEXT.dueDate}</Label>
								<Input
									id='board-task-dueDate'
									type='date'
									value={formState.dueDate}
									onChange={(event) => updateField('dueDate', event.target.value)}
								/>
							</div>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='board-task-tags'>{TASK_FORM_TEXT.tags}</Label>
							<Input
								id='board-task-tags'
								value={formState.tags}
								onChange={(event) => updateField('tags', event.target.value)}
								placeholder='ui, backend, urgent'
							/>
						</div>
					</div>

					<DialogDrawerFooter className='border-t border-border px-5 py-4 sm:px-6'>
						<Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
							{TASK_FORM_TEXT.cancel}
						</Button>
						<Button type='submit' disabled={isSubmitDisabled}>
							{isCreateMode ? TASK_FORM_TEXT.createSubmit : TASK_FORM_TEXT.editSubmit}
						</Button>
					</DialogDrawerFooter>
				</form>
			</DialogDrawerContent>
		</DialogDrawer>
	)
}

export { BoardTaskFormDialog }
