'use client'

import { useEffect, useId, useRef, useState } from 'react'

import {
	MAX_TASK_LABEL_LENGTH,
	MAX_TASK_LABELS,
	taskLabelKey,
	taskLabelNameSchema,
} from '@repo/types'
import { Button, Input, Label } from '@repo/ui'
import { Plus, Search, X } from '@repo/ui/icons'

import { useTaskLabels } from '@/shared/api/use-task-labels'

interface TaskLabelPickerProps {
	teamId: string
	projectId: string
	value: string[]
	onChange: (value: string[]) => void
	onBlur: () => void
	inputRef: (element: HTMLInputElement | null) => void
	disabled: boolean
	error?: string
}

export function TaskLabelPicker({
	teamId,
	projectId,
	value,
	onChange,
	onBlur,
	inputRef,
	disabled,
	error,
}: TaskLabelPickerProps) {
	const id = useId()
	const input = useRef<HTMLInputElement>(null)
	const [search, setSearch] = useState('')
	const [debouncedSearch, setDebouncedSearch] = useState('')
	const [validationError, setValidationError] = useState<string | null>(null)
	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), 250)
		return () => clearTimeout(timer)
	}, [search])
	const suggestions = useTaskLabels(teamId, projectId, debouncedSearch)
	const selected = new Set(value.map(taskLabelKey))
	const query = taskLabelKey(search)
	const available = (suggestions.data ?? []).filter(
		(label) => !selected.has(taskLabelKey(label)) && taskLabelKey(label).includes(query),
	)
	const draft = taskLabelNameSchema.safeParse(search)
	const limitReached = value.length >= MAX_TASK_LABELS
	const message = validationError ?? error
	const add = (name: string) => {
		if (disabled || limitReached) return
		const result = taskLabelNameSchema.safeParse(name)
		if (!result.success) {
			setValidationError(result.error.issues[0]?.message ?? 'Проверьте название метки')
			return
		}
		const key = taskLabelKey(result.data)
		if (!selected.has(key)) {
			const existing = suggestions.data?.find((label) => taskLabelKey(label) === key)
			onChange([...value, existing ?? result.data])
		}
		setSearch('')
		setValidationError(null)
		input.current?.focus()
	}
	return (
		<div className='space-y-2'>
			<Label htmlFor={`${id}-search`} className='text-sm leading-5'>
				Метки
			</Label>
			<div
				role='group'
				aria-label='Выбор меток'
				aria-busy={suggestions.isFetching}
				data-disabled={disabled}
				data-invalid={Boolean(message)}
				className='flex min-h-11 min-w-0 flex-wrap items-center gap-2 rounded-[var(--radius-control)] border border-input bg-card px-3 py-2 shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 data-[invalid=true]:border-destructive data-[invalid=true]:ring-destructive/20 dark:data-[invalid=true]:ring-destructive/40'
			>
				{value.length > 0 && (
					<ul role='list' aria-label='Метки задачи' className='contents'>
						{value.map((label) => (
							<li key={taskLabelKey(label)} className='flex min-w-0 max-w-full'>
								<Button
									type='button'
									variant='ghost'
									size='xs'
									disabled={disabled}
									className='max-w-full gap-1.5 rounded-sm bg-primary/10 font-normal text-primary hover:bg-primary/20 hover:text-primary disabled:opacity-100 dark:hover:bg-primary/20'
									aria-label={`Снять метку «${label}»`}
									onClick={() => {
										onChange(
											value.filter((item) => taskLabelKey(item) !== taskLabelKey(label)),
										)
										input.current?.focus()
									}}
								>
									<span className='truncate'>{label}</span>
									<X aria-hidden />
								</Button>
							</li>
						))}
					</ul>
				)}
				<div className='flex min-w-40 flex-1 items-center gap-2'>
					<Search aria-hidden className='size-4 shrink-0 text-muted-foreground' />
					<Input
						id={`${id}-search`}
						ref={(element) => {
							input.current = element
							inputRef(element)
						}}
						value={search}
						disabled={disabled}
						maxLength={MAX_TASK_LABEL_LENGTH}
						placeholder={
							value.length ? 'Добавить ещё метку…' : 'Найти или создать метку…'
						}
						className='h-6 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 disabled:opacity-100 dark:bg-transparent'
						aria-invalid={Boolean(message)}
						aria-describedby={`${id}-hint${message ? ` ${id}-error` : ''}`}
						onBlur={onBlur}
						onChange={(event) => {
							setSearch(event.target.value)
							setValidationError(null)
						}}
						onKeyDown={(event) => {
							if (event.key !== 'Enter' || event.nativeEvent.isComposing) return
							event.preventDefault()
							if (search.trim()) add(search)
						}}
					/>
					<span role='status' className='sr-only'>
						{suggestions.isFetching ? 'Ищем метки…' : ''}
					</span>
				</div>
			</div>
			{available.length > 0 && (
				<div className='flex min-w-0 flex-wrap items-center gap-2'>
					<span className='text-xs text-muted-foreground'>В проекте:</span>
					{available.slice(0, 8).map((label) => (
						<Button
							type='button'
							key={taskLabelKey(label)}
							variant='outline'
							size='sm'
							disabled={disabled || limitReached}
							className='max-w-full gap-1.5 bg-muted/50 px-2'
							aria-label={`Добавить метку «${label}»`}
							onClick={() => add(label)}
						>
							<Plus aria-hidden />
							<span className='truncate'>{label}</span>
						</Button>
					))}
				</div>
			)}
			{draft.success &&
				!selected.has(query) &&
				!available.some((label) => taskLabelKey(label) === query) && (
					<Button
						type='button'
						variant='outline'
						size='sm'
						disabled={disabled || limitReached}
						className='max-w-full'
						aria-label={`Добавить метку «${draft.data}»`}
						onClick={() => add(search)}
					>
						<Plus aria-hidden />
						<span className='truncate'>Добавить «{draft.data}»</span>
					</Button>
				)}
			{suggestions.isError && (
				<p role='alert' className='text-sm text-destructive'>
					Не удалось загрузить метки проекта.{' '}
					<Button
						type='button'
						variant='link'
						className='h-auto p-0'
						disabled={disabled}
						onClick={() => void suggestions.refetch()}
					>
						Повторить
					</Button>
				</p>
			)}
			<p id={`${id}-hint`} className='text-xs text-muted-foreground'>
				{limitReached
					? `Добавлено ${MAX_TASK_LABELS} меток. Удалите одну, чтобы выбрать другую.`
					: 'Можно выбрать несколько. Новая метка: введите название и нажмите Enter.'}
			</p>
			{message && (
				<p id={`${id}-error`} role='alert' className='text-sm text-destructive'>
					{message}
				</p>
			)}
		</div>
	)
}
