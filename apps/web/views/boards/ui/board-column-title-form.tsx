'use client'

import { useEffect, useId, useRef, useState, type FormEvent } from 'react'

import { createColumnSchema } from '@repo/types'
import { Button, Input, Label } from '@repo/ui'

import { isApiError } from '@/shared/lib/api/utils'

interface BoardColumnTitleFormProps {
	columnId?: string
	initialTitle?: string
	columns: readonly { id: string; title: string }[]
	disabled?: boolean
	onSubmit: (title: string) => Promise<void>
	onDone: () => void
}

function columnError(cause: unknown) {
	if (isApiError(cause)) {
		if (cause.statusCode === 403)
			return 'Управлять колонками могут владелец и администратор команды.'
		if (cause.statusCode === 409)
			return 'Название занято или данные доски изменились. Проверьте название и повторите попытку.'
		if (cause.statusCode === 404)
			return 'Колонка или доска больше недоступна. Обновите страницу.'
	}
	return 'Не удалось сохранить колонку. Повторите попытку.'
}

export function BoardColumnTitleForm({
	columnId,
	initialTitle = '',
	columns,
	disabled = false,
	onSubmit,
	onDone,
}: BoardColumnTitleFormProps) {
	const id = useId()
	const [title, setTitle] = useState(initialTitle)
	const initialValue = useRef(initialTitle)
	const [error, setError] = useState<string | null>(null)
	const [invalid, setInvalid] = useState(false)
	const [pending, setPending] = useState(false)
	const submitting = useRef(false)
	const mounted = useRef(true)
	useEffect(() => {
		mounted.current = true
		return () => {
			mounted.current = false
		}
	}, [])

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault()
		if (disabled || submitting.current) return
		const parsed = createColumnSchema.shape.title.safeParse(title)
		if (!parsed.success) {
			setInvalid(true)
			setError(
				title.trim()
					? 'Название должно быть не длиннее 100 символов.'
					: 'Укажите название колонки.',
			)
			return
		}
		if (columnId && parsed.data === initialValue.current.trim()) {
			onDone()
			return
		}
		if (
			columns.some(
				(column) => column.id !== columnId && column.title.trim() === parsed.data,
			)
		) {
			setInvalid(true)
			setError('Колонка с таким названием уже есть на этой доске.')
			return
		}
		submitting.current = true
		setPending(true)
		setError(null)
		setInvalid(false)
		try {
			await onSubmit(parsed.data)
			if (mounted.current) onDone()
		} catch (cause) {
			if (mounted.current) setError(columnError(cause))
		} finally {
			submitting.current = false
			if (mounted.current) setPending(false)
		}
	}

	return (
		<form
			className='min-w-0 space-y-3'
			aria-busy={pending}
			onSubmit={(event) => {
				void handleSubmit(event)
			}}
			onKeyDown={(event) => {
				if (event.key === 'Escape') {
					event.preventDefault()
					event.stopPropagation()
					if (!submitting.current && !disabled) onDone()
				}
			}}
		>
			<div className='space-y-2'>
				<Label htmlFor={id}>
					{columnId ? 'Название колонки' : 'Название новой колонки'}
				</Label>
				<Input
					id={id}
					autoFocus
					maxLength={100}
					value={title}
					disabled={pending || disabled}
					aria-invalid={invalid || undefined}
					aria-describedby={error ? `${id}-error` : undefined}
					placeholder='Например, На проверке'
					onChange={(event) => {
						setTitle(event.target.value)
						setError(null)
						setInvalid(false)
					}}
				/>
				{error && (
					<p id={`${id}-error`} role='alert' className='text-sm text-destructive'>
						{error}
					</p>
				)}
			</div>
			<div className='flex flex-wrap gap-2'>
				<Button type='submit' size='sm' disabled={pending || disabled}>
					{pending ? 'Сохраняем…' : columnId ? 'Сохранить' : 'Создать'}
				</Button>
				<Button
					type='button'
					variant='outline'
					size='sm'
					disabled={pending || disabled}
					onClick={() => {
						if (!submitting.current && !disabled) onDone()
					}}
				>
					Отмена
				</Button>
			</div>
		</form>
	)
}
