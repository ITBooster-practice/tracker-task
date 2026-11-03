'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useId, useRef, useState } from 'react'

import {
	Button,
	cn,
	Input,
	Label,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@repo/ui'
import { Check, GripVertical, Palette, Pencil, Trash2, X } from '@repo/ui/icons'

import type { ColumnDraft } from '../model/board-editor'
import { columnColors } from '../model/column-colors'
import { formatBoardTaskCount } from '../model/task-count'
import { ColumnColorPicker } from './board-column-color-picker'

const newColumnHint =
	'Порядок можно изменить сейчас: перетащите колонку за значок слева от названия.'

function ColumnTaskCount({ current, total }: { current: number; total: number }) {
	const incoming = total - current
	return (
		<span className='inline-flex shrink-0 items-center gap-1.5 text-xs leading-4'>
			{(current > 0 || incoming === 0) && (
				<span className='text-muted-foreground'>{formatBoardTaskCount(current)}</span>
			)}
			{incoming > 0 && (
				<span
					className='font-semibold text-choice-success'
					title={`Прибавится после сохранения: ${formatBoardTaskCount(incoming)}`}
				>
					+ ещё {current > 0 ? incoming : formatBoardTaskCount(incoming)}
				</span>
			)}
		</span>
	)
}

export function ColumnDraftRow({
	column,
	taskCount,
	selected,
	disabled,
	sortingDisabled = false,
	deleting = false,
	canDelete,
	onSelect,
	onChange,
	onDelete,
}: {
	column: ColumnDraft
	taskCount: number
	selected: boolean
	disabled: boolean
	sortingDisabled?: boolean
	deleting?: boolean
	canDelete: boolean
	onSelect: () => void
	onChange: (patch: Partial<ColumnDraft>) => void
	onDelete: () => void
}) {
	const [editing, setEditing] = useState(!column.title && !column.isNew)
	const input = useRef<HTMLInputElement>(null)
	const row = useRef<HTMLDivElement>(null)
	const originalTitle = useRef(column.title)
	const fieldId = useId()
	const errorId = `${fieldId}-error`
	const isNew = column.isNew === true
	const title = column.title.trim() || 'Новая колонка'
	const color = columnColors[column.color]
	const invalidTitle = !column.title.trim()
	const deleteReason = column.isSystem
		? 'Системная колонка используется статусами задач'
		: !canDelete
			? 'На доске должна оставаться хотя бы одна колонка'
			: undefined
	const {
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: column.localId,
		disabled: disabled || sortingDisabled,
	})

	useEffect(() => {
		if (selected) row.current?.scrollIntoView?.({ block: 'nearest' })
	}, [selected])

	useEffect(() => {
		if (!editing && !isNew) return
		const frame = requestAnimationFrame(() => {
			input.current?.focus()
			if (editing) input.current?.select()
		})
		return () => cancelAnimationFrame(frame)
	}, [editing, isNew])

	const finishRenaming = (value = column.title) => {
		const nextTitle = value.trim()
		if (!nextTitle) return
		if (nextTitle !== column.title) onChange({ title: nextTitle })
		setEditing(false)
	}

	const grip = (
		<Button
			ref={setActivatorNodeRef}
			type='button'
			variant='ghost'
			size='icon-sm'
			className='touch-none cursor-grab text-muted-foreground active:cursor-grabbing'
			disabled={disabled || sortingDisabled}
			{...attributes}
			{...listeners}
			aria-label={`Переместить колонку «${title}»`}
		>
			<GripVertical aria-hidden />
		</Button>
	)

	return (
		<div
			ref={(element) => {
				row.current = element
				setNodeRef(element)
			}}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			onPointerDownCapture={() => {
				if (!disabled) onSelect()
			}}
			onFocusCapture={() => {
				if (!disabled) onSelect()
			}}
			className={cn(
				'relative min-w-0 motion-reduce:transition-none',
				isNew
					? 'flex flex-col gap-3 bg-primary/5 p-4'
					: 'flex min-h-[54px] flex-wrap items-center gap-2 px-3 py-2.5',
				selected && 'ring-1 ring-primary ring-inset',
				selected && !isNew && 'bg-primary/10',
				isDragging && 'z-10 opacity-40',
			)}
		>
			{isNew ? (
				<>
					<div className='flex min-w-0 items-center gap-2'>
						{grip}
						<p className='min-w-0 text-sm leading-5 font-semibold'>Новая колонка</p>
						<div className='ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2'>
							{taskCount > 0 && (
								<ColumnTaskCount current={column.taskCount} total={taskCount} />
							)}
							<span className='text-xs leading-4 text-primary'>Не сохранена</span>
						</div>
					</div>
					<div className='flex min-w-0 flex-wrap items-end gap-3'>
						<div className='min-w-0 flex-1 basis-48 space-y-1.5'>
							<Label htmlFor={fieldId} required className='leading-5'>
								Название
							</Label>
							<Input
								ref={input}
								id={fieldId}
								aria-label='Название новой колонки'
								className='h-10'
								value={column.title}
								maxLength={100}
								disabled={disabled}
								aria-required
								placeholder='Название колонки'
								onChange={(event) => onChange({ title: event.target.value })}
								onKeyDown={(event) => {
									if (event.key === 'Enter') event.preventDefault()
								}}
							/>
						</div>
						<div className='min-w-0 space-y-1.5'>
							<Label htmlFor={`${fieldId}-color`} className='leading-5'>
								Цвет
							</Label>
							<ColumnColorPicker
								id={`${fieldId}-color`}
								column={column}
								disabled={disabled}
								onChange={(color) => onChange({ color })}
							/>
						</div>
						<Button
							type='button'
							variant='outline'
							size='icon-lg'
							disabled={disabled || !canDelete}
							onClick={onDelete}
							aria-label={`Отменить добавление колонки «${title}»`}
						>
							<X aria-hidden />
						</Button>
					</div>
					<p className='text-xs leading-4 text-muted-foreground'>{newColumnHint}</p>
				</>
			) : (
				<>
					{grip}
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<span
									role='img'
									aria-label={`Цвет колонки: ${color.label}`}
									tabIndex={0}
									className={cn(
										'size-2 shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring',
										color.className,
									)}
								/>
							</TooltipTrigger>
							<TooltipContent side='top' sideOffset={8}>
								{color.label}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
					<div className='min-w-0 flex-1 basis-24'>
						{editing ? (
							<div className='space-y-1'>
								<Input
									ref={input}
									aria-label='Название колонки'
									data-board-column-rename
									aria-invalid={invalidTitle || undefined}
									aria-describedby={invalidTitle ? errorId : undefined}
									value={column.title}
									maxLength={100}
									disabled={disabled}
									placeholder='Название колонки'
									onChange={(event) => onChange({ title: event.target.value })}
									onBlur={(event) => finishRenaming(event.currentTarget.value)}
									onKeyDown={(event) => {
										if (event.key === 'Enter') {
											event.preventDefault()
											finishRenaming(event.currentTarget.value)
										}
										if (event.key === 'Escape') {
											event.preventDefault()
											event.stopPropagation()
											onChange({ title: originalTitle.current })
											setEditing(false)
										}
									}}
								/>
								{invalidTitle && (
									<p id={errorId} className='text-xs leading-4 text-destructive'>
										Укажите название колонки.
									</p>
								)}
							</div>
						) : (
							<p className='truncate text-sm leading-5 font-normal' title={column.title}>
								{column.title}
							</p>
						)}
					</div>
					<ColumnTaskCount current={column.taskCount} total={taskCount} />
					<div className='ml-auto flex items-center gap-1'>
						<ColumnColorPicker
							column={column}
							disabled={disabled}
							onChange={(color) => onChange({ color })}
						/>
						<Button
							type='button'
							variant='ghost'
							size='icon-sm'
							disabled={disabled}
							onPointerDown={(event) => {
								if (editing) event.preventDefault()
							}}
							onClick={() => {
								if (editing) finishRenaming()
								else {
									originalTitle.current = column.title
									setEditing(true)
								}
							}}
							aria-label={
								editing
									? `Завершить переименование колонки «${title}»`
									: `Переименовать колонку «${title}»`
							}
						>
							{editing ? <Check aria-hidden /> : <Pencil aria-hidden />}
						</Button>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<span
										className='inline-flex'
										tabIndex={deleteReason && !disabled ? 0 : undefined}
										aria-label={deleteReason}
									>
										<Button
											type='button'
											variant='ghost'
											size='icon-sm'
											disabled={disabled || !!deleteReason}
											onClick={onDelete}
											aria-label={`Удалить колонку «${title}»`}
											className={cn(
												'border border-transparent text-destructive hover:bg-destructive/10 hover:text-destructive',
												deleting &&
													'border-destructive bg-destructive/10 text-destructive',
											)}
										>
											<Trash2 aria-hidden />
										</Button>
									</span>
								</TooltipTrigger>
								<TooltipContent>
									{deleteReason ?? `Удалить колонку «${title}»`}
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				</>
			)}
		</div>
	)
}

export function ColumnDraftPreview({
	column,
	taskCount,
}: {
	column: ColumnDraft
	taskCount: number
}) {
	const color = columnColors[column.color]
	return (
		<div
			aria-hidden
			className={cn(
				'pointer-events-none min-w-0 rounded-[var(--radius-control)] bg-card shadow-lg ring-1 ring-primary',
				column.isNew
					? 'flex flex-col gap-3 p-4'
					: 'flex min-h-[54px] flex-wrap items-center gap-2 px-3 py-2.5',
			)}
		>
			{column.isNew ? (
				<>
					<div className='flex min-w-0 items-center gap-2'>
						<span className='flex size-8 shrink-0 items-center justify-center text-muted-foreground'>
							<GripVertical className='size-4' />
						</span>
						<p className='text-sm leading-5 font-semibold'>Новая колонка</p>
						<div className='ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2'>
							{taskCount > 0 && (
								<ColumnTaskCount current={column.taskCount} total={taskCount} />
							)}
							<span className='text-xs leading-4 text-primary'>Не сохранена</span>
						</div>
					</div>
					<div className='flex min-w-0 flex-wrap items-end gap-3'>
						<div className='min-w-0 flex-1 basis-48 space-y-1.5'>
							<Label required className='leading-5'>
								Название
							</Label>
							<p className='h-10 truncate rounded-[var(--radius-control)] border border-input px-3 py-2 text-sm leading-6'>
								{column.title || 'Название колонки'}
							</p>
						</div>
						<div className='space-y-1.5'>
							<p className='text-sm leading-5 font-medium'>Цвет</p>
							<span className='flex h-10 items-center gap-2 rounded-[var(--radius-control)] border border-input px-3 text-sm'>
								<span className={cn('size-3 rounded-full', color.className)} />
								{color.label}
								<Palette className='size-4' />
							</span>
						</div>
						<span className='flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] border bg-background shadow-xs dark:border-input dark:bg-input/30'>
							<X className='size-4' />
						</span>
					</div>
					<p className='text-xs leading-4 text-muted-foreground'>{newColumnHint}</p>
				</>
			) : (
				<>
					<span className='flex size-8 shrink-0 items-center justify-center text-muted-foreground'>
						<GripVertical className='size-4' />
					</span>
					<span className={cn('size-2 shrink-0 rounded-full', color.className)} />
					<div className='min-w-0 flex-1 basis-24'>
						<p className='truncate text-sm leading-5'>{column.title}</p>
					</div>
					<ColumnTaskCount current={column.taskCount} total={taskCount} />
					<div className='ml-auto flex items-center gap-1'>
						<span className='flex h-8 shrink-0 items-center gap-1.5 rounded-[var(--radius-control)] border px-3 text-sm font-medium'>
							<Palette className='size-4' />
							Цвет
						</span>
						<span className='flex size-8 shrink-0 items-center justify-center'>
							<Pencil className='size-4' />
						</span>
						<span className='flex size-8 shrink-0 items-center justify-center'>
							<Trash2 className='size-4 text-destructive' />
						</span>
					</div>
				</>
			)}
		</div>
	)
}
