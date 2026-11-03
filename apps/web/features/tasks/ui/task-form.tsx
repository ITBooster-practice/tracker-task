'use client'

import { Controller, useWatch, type UseFormReturn } from 'react-hook-form'

import { TaskStatusSchema, type TaskStatus } from '@repo/types'
import {
	Button,
	ChoiceGroup,
	ChoiceGroupItem,
	DateTimePicker,
	Input,
	Label,
	Textarea,
} from '@repo/ui'
import { CircleDashed, Info } from '@repo/ui/icons'

import {
	TASK_PRIORITY_OPTIONS,
	TASK_STATUS_OPTIONS,
	TASK_TYPE_OPTIONS,
	type TaskFormColumn,
	type TaskFormValues,
} from '../model/form'
import { TaskAssigneeChoices } from './task-assignee-choices'
import {
	taskPriorityChoices,
	taskStatusChoices,
	taskTypeChoices,
} from './task-choice-options'
import { TaskLabelPicker } from './task-label-picker'

interface TaskFormProps {
	form: UseFormReturn<TaskFormValues>
	teamId: string
	projectId: string
	mode?: 'create' | 'edit'
	columns?: readonly TaskFormColumn[]
	columnsPending?: boolean
	columnsError?: string
	onRetryColumns?: () => void
	members: { userId: string; name: string | null }[]
	membersPending?: boolean
	membersError?: boolean
	onRetryMembers: () => void
	pending: boolean
	serverError?: string | null
	visibilityWarning?: string
	onSubmit: (data: TaskFormValues) => Promise<void>
	onCancel: () => void
}

export function TaskForm({
	form,
	teamId,
	projectId,
	mode = 'create',
	columns,
	columnsPending,
	columnsError,
	onRetryColumns,
	members,
	membersPending,
	membersError,
	onRetryMembers,
	pending,
	serverError,
	visibilityWarning,
	onSubmit,
	onCancel,
}: TaskFormProps) {
	const {
		register,
		control,
		formState: { errors, isValid, isSubmitting, isDirty },
	} = form
	const busy = pending || isSubmitting
	const columnId = useWatch({ control, name: 'boardColumnId' })
	const invalidColumn = Boolean(
		columns && !columns.some((column) => column.id === columnId),
	)
	return (
		<form
			onSubmit={form.handleSubmit(onSubmit)}
			className='grid min-h-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden text-base leading-6 font-normal'
		>
			<fieldset
				disabled={busy}
				aria-busy={busy}
				className='min-h-0 space-y-5 overflow-y-auto px-6 pb-6 sm:px-8'
			>
				<div className='space-y-2'>
					<Label htmlFor='task-title' required className='text-sm leading-5'>
						Название
					</Label>
					<Input
						id='task-title'
						autoFocus
						required
						maxLength={255}
						placeholder='Что нужно сделать?'
						className='h-11 bg-card text-base leading-6 md:text-base'
						aria-label='Название'
						aria-invalid={Boolean(errors.title)}
						aria-describedby={errors.title ? 'task-title-error' : undefined}
						{...register('title', { setValueAs: (value: string) => value.trim() })}
					/>
					{errors.title && (
						<p id='task-title-error' role='alert' className='text-sm text-destructive'>
							{errors.title.message}
						</p>
					)}
				</div>
				<div className='space-y-2'>
					<Label htmlFor='task-description' className='text-sm leading-5'>
						Описание
					</Label>
					<Textarea
						id='task-description'
						rows={3}
						maxLength={5000}
						placeholder='Добавьте детали, ссылки и критерии готовности'
						className='min-h-18 bg-card text-base leading-6 md:text-base'
						aria-invalid={Boolean(errors.description)}
						aria-describedby={errors.description ? 'task-description-error' : undefined}
						{...register('description', {
							setValueAs: (value: string) => value.trim(),
						})}
					/>
					{errors.description && (
						<p
							id='task-description-error'
							role='alert'
							className='text-sm text-destructive'
						>
							{errors.description.message}
						</p>
					)}
				</div>
				<Controller
					control={control}
					name='labels'
					render={({ field }) => (
						<TaskLabelPicker
							teamId={teamId}
							projectId={projectId}
							value={field.value}
							onChange={field.onChange}
							onBlur={field.onBlur}
							inputRef={field.ref}
							disabled={busy}
							error={errors.labels?.message}
						/>
					)}
				/>
				<div className='space-y-5'>
					<Controller
						control={control}
						name='type'
						render={({ field }) => (
							<div className='space-y-2'>
								<Label id='task-type-label' className='text-sm leading-5'>
									Тип задачи
								</Label>
								<ChoiceGroup
									aria-labelledby='task-type-label'
									name='type'
									value={field.value}
									onValueChange={field.onChange}
									onBlur={field.onBlur}
									disabled={busy}
								>
									{TASK_TYPE_OPTIONS.map((option) => {
										const { Icon, tone } = taskTypeChoices[option.value]
										return (
											<ChoiceGroupItem
												key={option.value}
												value={option.value}
												tone={tone}
												icon={<Icon />}
												ref={field.value === option.value ? field.ref : undefined}
											>
												{option.label}
											</ChoiceGroupItem>
										)
									})}
								</ChoiceGroup>
							</div>
						)}
					/>
					<Controller
						control={control}
						name='priority'
						render={({ field }) => (
							<div className='space-y-2'>
								<Label id='task-priority-label' className='text-sm leading-5'>
									Приоритет
								</Label>
								<ChoiceGroup
									aria-labelledby='task-priority-label'
									name='priority'
									value={field.value}
									onValueChange={field.onChange}
									onBlur={field.onBlur}
									disabled={busy}
								>
									{TASK_PRIORITY_OPTIONS.map((option) => {
										const { Icon, tone } = taskPriorityChoices[option.value]
										return (
											<ChoiceGroupItem
												key={option.value}
												value={option.value}
												tone={tone}
												icon={<Icon />}
												ref={field.value === option.value ? field.ref : undefined}
											>
												{option.label}
											</ChoiceGroupItem>
										)
									})}
								</ChoiceGroup>
							</div>
						)}
					/>
					<Controller
						control={control}
						name={columns ? 'boardColumnId' : 'status'}
						render={({ field }) => (
							<div className='space-y-2'>
								<Label id='task-status-label' className='text-sm leading-5'>
									{columns ? 'Колонка' : 'Статус'}
								</Label>
								<ChoiceGroup
									aria-labelledby='task-status-label'
									name={columns ? 'boardColumnId' : 'status'}
									disabled={Boolean(busy || columnsPending || columnsError)}
									value={field.value}
									onValueChange={(value) => {
										field.onChange(value)
										if (columns && mode === 'create') {
											const status = TaskStatusSchema.safeParse(
												columns.find((column) => column.id === value)?.key,
											)
											if (status.success)
												form.setValue('status', status.data, {
													shouldDirty: true,
													shouldValidate: true,
												})
										}
									}}
									onBlur={field.onBlur}
								>
									{(
										columns?.map((column) => ({
											value: column.id,
											label: column.title,
											status: column.key,
										})) ??
										TASK_STATUS_OPTIONS.map((option) => ({
											...option,
											status: option.value,
										}))
									).map((option) => {
										const { Icon, tone } = taskStatusChoices[
											option.status as TaskStatus
										] ?? {
											Icon: CircleDashed,
											tone: 'neutral' as const,
										}
										return (
											<ChoiceGroupItem
												key={option.value}
												value={option.value}
												tone={tone}
												icon={<Icon />}
												ref={field.value === option.value ? field.ref : undefined}
											>
												{option.label}
											</ChoiceGroupItem>
										)
									})}
								</ChoiceGroup>
								{columnsPending ? (
									<p role='status' className='text-sm text-muted-foreground'>
										Загружаем колонки…
									</p>
								) : columnsError ? (
									<p role='alert' className='text-sm text-destructive'>
										{columnsError}{' '}
										<Button
											type='button'
											variant='link'
											onClick={onRetryColumns}
											disabled={busy}
										>
											Обновить колонки
										</Button>
									</p>
								) : invalidColumn ? (
									<p role='alert' className='text-sm text-destructive'>
										Выбранная колонка недоступна. Выберите другую колонку.
									</p>
								) : null}
							</div>
						)}
					/>
					<Controller
						control={control}
						name='assigneeId'
						render={({ field }) => (
							<TaskAssigneeChoices
								value={field.value}
								onChange={field.onChange}
								onBlur={field.onBlur}
								inputRef={field.ref}
								members={members}
								disabled={Boolean(busy || membersPending || membersError)}
							/>
						)}
					/>
					<Controller
						control={control}
						name='dueDate'
						render={({ field }) => (
							<div className='space-y-2 [&_[data-slot=input]]:h-11 [&_[data-slot=input]]:bg-card [&_[data-slot=input]]:text-base [&_[data-slot=input]]:leading-6 [&_[data-slot=label]]:text-sm [&_[data-slot=label]]:leading-5'>
								<DateTimePicker
									id='task-dueDate'
									label='Срок'
									disabled={busy}
									inputProps={{
										ref: field.ref,
										onBlur: field.onBlur,
										'aria-invalid': Boolean(errors.dueDate),
										'aria-describedby': errors.dueDate ? 'task-date-error' : undefined,
									}}
									value={field.value?.slice(0, 10) ?? ''}
									onChange={(value) => {
										field.onChange(
											value ? new Date(`${value}T00:00:00.000Z`).toISOString() : null,
										)
									}}
								/>
								{errors.dueDate && (
									<p
										id='task-date-error'
										role='alert'
										className='text-sm text-destructive'
									>
										{errors.dueDate.message}
									</p>
								)}
							</div>
						)}
					/>
				</div>
				{visibilityWarning && (
					<p className='flex items-start gap-2 rounded-[var(--radius-control)] bg-primary/10 p-3 text-xs text-muted-foreground'>
						<Info aria-hidden className='mt-0.5 size-4 shrink-0 text-primary' />
						<span>{visibilityWarning}</span>
					</p>
				)}
				{membersPending && (
					<p role='status' className='text-sm text-muted-foreground'>
						Загружаем участников…
					</p>
				)}
				{membersError && (
					<p role='alert' className='text-sm text-destructive'>
						Не удалось загрузить участников.{' '}
						<Button type='button' variant='link' onClick={onRetryMembers}>
							Повторить
						</Button>
					</p>
				)}
				{serverError && (
					<p role='alert' className='text-sm text-destructive'>
						{serverError}
					</p>
				)}
			</fieldset>
			<div className='flex flex-wrap justify-end gap-3 border-t border-border px-6 py-5 sm:px-8'>
				<Button type='button' variant='outline' disabled={busy} onClick={onCancel}>
					Отмена
				</Button>
				<Button
					type='submit'
					disabled={
						busy ||
						!isValid ||
						columnsPending ||
						Boolean(columnsError) ||
						invalidColumn ||
						(mode === 'edit' && !isDirty)
					}
				>
					{busy
						? mode === 'edit'
							? 'Сохранение…'
							: 'Создание…'
						: mode === 'edit'
							? 'Сохранить изменения'
							: 'Создать задачу'}
				</Button>
			</div>
		</form>
	)
}
