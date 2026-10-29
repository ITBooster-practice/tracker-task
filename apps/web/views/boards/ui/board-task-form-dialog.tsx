'use client'

import { useState, type FormEvent } from 'react'

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

import { BOARD_PRIORITY_LABELS, BOARD_TYPE_OPTIONS } from '../model/constants'
import type {
	BoardAssignee,
	BoardColumn,
	BoardTask,
	BoardTaskFormValues,
} from '../model/types'

interface BoardTaskFormDialogProps {
	open: boolean
	mode: 'create' | 'edit'
	task: BoardTask | null
	columns: readonly Pick<BoardColumn, 'id' | 'key' | 'title'>[]
	assignees: BoardAssignee[]
	showTags?: boolean
	allowColumnChange?: boolean
	isPending?: boolean
	error?: string | null
	assigneesPending?: boolean
	assigneesError?: boolean
	onRetryAssignees?: () => void
	onOpenChange: (open: boolean) => void
	onSubmit: (values: BoardTaskFormValues) => void
}

function BoardTaskForm({
	open,
	mode,
	task,
	columns,
	assignees,
	showTags = true,
	allowColumnChange = true,
	isPending = false,
	error,
	assigneesPending = false,
	assigneesError = false,
	onRetryAssignees,
	onOpenChange,
	onSubmit,
}: BoardTaskFormDialogProps) {
	const [formState, setFormState] = useState(() => ({
		title: task?.title ?? '',
		type: task?.type ?? 'TASK',
		description: task?.description ?? '',
		boardColumnId:
			task?.boardColumnId ??
			columns.find((column) => column.key === 'TODO')?.id ??
			columns[0]?.id ??
			'',
		priority: task?.priority ?? 'MEDIUM',
		assigneeId: task?.assigneeId ?? '',
		dueDate: task?.dueDate?.slice(0, 10) ?? '',
		tags: task?.tags.join(', ') ?? '',
	}))
	const isCreateMode = mode === 'create'
	const isSubmitDisabled =
		isPending ||
		!formState.title.trim() ||
		formState.title.trim().length > 255 ||
		formState.description.length > 5000 ||
		!columns.some((column) => column.id === formState.boardColumnId)
	const selectedColumnLabel = columns.find(
		(column) => column.id === formState.boardColumnId,
	)?.title
	const selectedAssigneeLabel =
		assignees.find((assignee) => assignee.id === formState.assigneeId)?.name ??
		(task?.assigneeId === formState.assigneeId ? task?.assignee?.name : undefined) ??
		(formState.assigneeId ? 'Назначенный участник' : 'Без исполнителя')

	const updateField = <Field extends keyof typeof formState>(
		field: Field,
		value: (typeof formState)[Field],
	) => setFormState((current) => ({ ...current, [field]: value }))

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		if (isSubmitDisabled) return
		onSubmit({
			...formState,
			title: formState.title.trim(),
			description: formState.description.trim(),
			tags: formState.tags
				.split(',')
				.map((tag) => tag.trim())
				.filter(Boolean),
		})
	}

	return (
		<DialogDrawer
			open={open}
			onOpenChange={(nextOpen) => {
				if (!isPending) onOpenChange(nextOpen)
			}}
		>
			<DialogDrawerContent className='max-h-[min(760px,calc(100dvh-2rem))] overflow-hidden rounded-[var(--radius-surface)] border-border bg-card p-0 shadow-lg sm:max-w-[680px]'>
				<form
					onSubmit={handleSubmit}
					className='grid max-h-[inherit] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden'
				>
					<DialogDrawerHeader className='px-5 pt-5 pb-3 text-left sm:px-6'>
						<DialogDrawerTitle className='text-lg leading-7 font-semibold'>
							{isCreateMode ? 'Создать задачу' : 'Редактировать задачу'}
						</DialogDrawerTitle>
						<DialogDrawerDescription className='text-sm leading-5'>
							{isCreateMode
								? 'Новая задача появится в выбранной колонке основной доски.'
								: 'Изменения сохранятся в проекте.'}
						</DialogDrawerDescription>
					</DialogDrawerHeader>
					<fieldset
						disabled={isPending}
						aria-busy={isPending}
						className='min-h-0 space-y-4 overflow-y-auto px-5 py-2 sm:px-6'
					>
						<div className='space-y-2'>
							<Label htmlFor='board-task-title'>Название</Label>
							<Input
								id='board-task-title'
								required
								maxLength={255}
								value={formState.title}
								onChange={(event) => updateField('title', event.target.value)}
								placeholder='Например, подготовить релиз'
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='board-task-description'>Описание</Label>
							<Textarea
								id='board-task-description'
								maxLength={5000}
								value={formState.description}
								onChange={(event) => updateField('description', event.target.value)}
								rows={4}
								placeholder='Контекст и ожидаемый результат'
								className='min-h-28 resize-y'
							/>
						</div>
						<div className='grid gap-4 sm:grid-cols-2'>
							{allowColumnChange && (
								<div className='space-y-2'>
									<Label htmlFor='board-task-column'>Колонка</Label>
									<Select
										value={formState.boardColumnId}
										onValueChange={(value) => updateField('boardColumnId', value)}
									>
										<SelectTrigger id='board-task-column'>
											<SelectValue placeholder={selectedColumnLabel} />
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
							)}
							<div className='space-y-2'>
								<Label htmlFor='board-task-type'>Тип задачи</Label>
								<Select
									value={formState.type}
									onValueChange={(value) =>
										updateField('type', value as BoardTask['type'])
									}
								>
									<SelectTrigger id='board-task-type'>
										<SelectValue
											placeholder={
												BOARD_TYPE_OPTIONS.find(
													(option) => option.value === formState.type,
												)?.label
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{BOARD_TYPE_OPTIONS.filter((option) => option.value !== 'ALL').map(
											(option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											),
										)}
									</SelectContent>
								</Select>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='board-task-priority'>Приоритет</Label>
								<Select
									value={formState.priority}
									onValueChange={(value) =>
										updateField('priority', value as BoardTask['priority'])
									}
								>
									<SelectTrigger id='board-task-priority'>
										<SelectValue
											placeholder={BOARD_PRIORITY_LABELS[formState.priority]}
										/>
									</SelectTrigger>
									<SelectContent>
										{Object.entries(BOARD_PRIORITY_LABELS).map(([value, label]) => (
											<SelectItem key={value} value={value}>
												{label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='board-task-assignee'>Исполнитель</Label>
								<Select
									disabled={assigneesPending || assigneesError}
									value={formState.assigneeId || '__unassigned__'}
									onValueChange={(value) =>
										updateField('assigneeId', value === '__unassigned__' ? '' : value)
									}
								>
									<SelectTrigger id='board-task-assignee'>
										<SelectValue placeholder={selectedAssigneeLabel} />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='__unassigned__'>Без исполнителя</SelectItem>
										{formState.assigneeId &&
											!assignees.some((item) => item.id === formState.assigneeId) && (
												<SelectItem value={formState.assigneeId}>
													{selectedAssigneeLabel}
												</SelectItem>
											)}
										{assignees.map((assignee) => (
											<SelectItem key={assignee.id} value={assignee.id}>
												{assignee.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='board-task-dueDate'>Дедлайн</Label>
								<Input
									id='board-task-dueDate'
									type='date'
									value={formState.dueDate}
									onChange={(event) => updateField('dueDate', event.target.value)}
								/>
							</div>
						</div>
						{assigneesPending && (
							<p role='status' className='text-sm text-muted-foreground'>
								Загружаем участников…
							</p>
						)}
						{assigneesError && (
							<p role='alert' className='text-sm text-destructive'>
								Не удалось загрузить участников.{' '}
								<Button type='button' variant='link' onClick={onRetryAssignees}>
									Повторить
								</Button>
							</p>
						)}
						{showTags && (
							<div className='space-y-2'>
								<Label htmlFor='board-task-tags'>Теги</Label>
								<Input
									id='board-task-tags'
									value={formState.tags}
									onChange={(event) => updateField('tags', event.target.value)}
									placeholder='ui, backend, urgent'
								/>
							</div>
						)}
						{error && (
							<p role='alert' className='text-sm text-destructive'>
								{error}
							</p>
						)}
					</fieldset>
					<DialogDrawerFooter className='border-t border-border px-5 py-4 sm:px-6'>
						<Button
							type='button'
							variant='outline'
							disabled={isPending}
							onClick={() => onOpenChange(false)}
						>
							Отмена
						</Button>
						<Button type='submit' disabled={Boolean(isSubmitDisabled)}>
							{isPending ? 'Сохраняем…' : isCreateMode ? 'Создать' : 'Сохранить'}
						</Button>
					</DialogDrawerFooter>
				</form>
			</DialogDrawerContent>
		</DialogDrawer>
	)
}

function BoardTaskFormDialog(props: BoardTaskFormDialogProps) {
	return props.open ? (
		<BoardTaskForm key={props.task?.id ?? props.mode} {...props} />
	) : null
}

export { BoardTaskFormDialog }
