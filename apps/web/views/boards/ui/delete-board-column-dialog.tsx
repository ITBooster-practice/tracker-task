'use client'

import { useEffect, useId, useRef, useState } from 'react'

import {
	ConfirmDialog,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@repo/ui'

import { isApiError } from '@/shared/lib/api/utils'

import type { BoardColumn } from '../model/types'

interface DeleteBoardColumnDialogProps {
	column: BoardColumn
	columns: BoardColumn[]
	disabled?: boolean
	onConfirm: (targetColumnId: string) => Promise<void>
	onClose: () => void
	onRestoreFocus?: () => void
}

export function DeleteBoardColumnDialog({
	column,
	columns,
	disabled = false,
	onConfirm,
	onClose,
	onRestoreFocus,
}: DeleteBoardColumnDialogProps) {
	const id = useId()
	const [targetId, setTargetId] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [pending, setPending] = useState(false)
	const submitting = useRef(false)
	const mounted = useRef(true)
	useEffect(() => {
		mounted.current = true
		return () => {
			mounted.current = false
		}
	}, [])
	const targets = columns.filter((item) => item.id !== column.id)
	const target = targets.find((item) => item.id === targetId)
	const blocked = column.isSystem || targets.length === 0
	const confirm = async () => {
		if (submitting.current || disabled || blocked || !target) return
		submitting.current = true
		setPending(true)
		setError(null)
		try {
			await onConfirm(target.id)
			if (mounted.current) onClose()
		} catch (cause) {
			if (mounted.current)
				setError(
					isApiError(cause) && cause.statusCode === 403
						? 'Удалять колонки могут владелец и администратор команды.'
						: isApiError(cause) && [400, 404, 409].includes(cause.statusCode)
							? 'Данные доски изменились. Проверьте колонку назначения и повторите попытку.'
							: 'Не удалось удалить колонку. Повторите попытку.',
				)
		} finally {
			submitting.current = false
			if (mounted.current) setPending(false)
		}
	}
	return (
		<ConfirmDialog
			onCloseAutoFocus={
				onRestoreFocus
					? (event) => {
							event.preventDefault()
							onRestoreFocus()
						}
					: undefined
			}
			open
			title='Удалить колонку?'
			description={
				column.isSystem
					? 'Системную колонку удалить нельзя.'
					: !targets.length
						? 'Последнюю колонку доски удалить нельзя.'
						: `Колонка «${column.title}» будет удалена. Задачи сохранятся и переместятся в конец выбранной колонки.`
			}
			confirmLabel='Удалить колонку'
			pendingLabel='Удаляем…'
			confirmDisabled={disabled || blocked || !target}
			isPending={pending}
			onConfirm={confirm}
			onOpenChange={(open) => {
				if (!open && !submitting.current) onClose()
			}}
		>
			{!blocked && (
				<div className='space-y-2'>
					<Label htmlFor={id}>Перенести задачи в колонку</Label>
					<Select
						value={target ? targetId : ''}
						onValueChange={(value) => {
							setTargetId(value)
							setError(null)
						}}
						disabled={pending || disabled}
					>
						<SelectTrigger
							id={id}
							aria-describedby={`${id}-hint`}
							className='w-full min-w-0'
						>
							<SelectValue placeholder='Выберите колонку' />
						</SelectTrigger>
						<SelectContent>
							{targets.map((item) => (
								<SelectItem key={item.id} value={item.id}>
									{item.title}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<p id={`${id}-hint`} className='text-sm text-muted-foreground'>
						Колонка назначения обязательна, даже если сейчас задач нет. При переносе в
						системную колонку задачи получат её статус.
					</p>
				</div>
			)}
			{error && (
				<p role='alert' className='mt-3 text-sm text-destructive'>
					{error}
				</p>
			)}
		</ConfirmDialog>
	)
}
