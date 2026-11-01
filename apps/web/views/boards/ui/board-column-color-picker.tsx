'use client'

import { useId, useState } from 'react'

import type { BoardColumnColor } from '@repo/types'
import {
	Button,
	ChoiceGroup,
	ChoiceGroupItem,
	cn,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@repo/ui'
import { Check, Palette, X } from '@repo/ui/icons'

import type { ColumnDraft } from '../model/board-editor'
import { columnColors } from '../model/column-colors'

export function ColumnColorPicker({
	column,
	disabled,
	id,
	onChange,
}: {
	column: Pick<ColumnDraft, 'title' | 'color' | 'isNew'>
	disabled: boolean
	id?: string
	onChange: (color: BoardColumnColor) => void
}) {
	const [open, setOpen] = useState(false)
	const headingId = useId()
	const descriptionId = useId()
	const title = column.title.trim() || 'Новая колонка'
	const currentColor = columnColors[column.color]

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					id={id}
					type='button'
					variant='outline'
					size={column.isNew ? 'lg' : 'sm'}
					className={cn(
						'data-[state=open]:border-primary data-[state=open]:bg-primary/10 data-[state=open]:text-primary data-[state=open]:hover:bg-primary/15 data-[state=open]:hover:text-primary dark:data-[state=open]:border-primary dark:data-[state=open]:bg-primary/10 dark:data-[state=open]:hover:bg-primary/15',
						column.isNew && 'max-w-full justify-start px-3',
					)}
					disabled={disabled}
					aria-label={`Изменить цвет колонки «${title}»`}
				>
					{column.isNew ? (
						<>
							<span
								aria-hidden
								className={cn('size-3 shrink-0 rounded-full', currentColor.className)}
							/>
							<span className='truncate'>{currentColor.label}</span>
							<Palette aria-hidden />
						</>
					) : (
						<>
							<Palette aria-hidden />
							Цвет
						</>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align='end'
				collisionPadding={16}
				aria-labelledby={headingId}
				aria-describedby={descriptionId}
				className='flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-4 rounded-[var(--radius-control)] p-4'
			>
				<div className='space-y-1'>
					<div className='flex items-center justify-between gap-3'>
						<p id={headingId} className='text-base leading-6 font-semibold'>
							Цвет колонки
						</p>
						<Button
							type='button'
							variant='ghost'
							size='icon-sm'
							aria-label='Закрыть палитру'
							onClick={() => setOpen(false)}
						>
							<X aria-hidden />
						</Button>
					</div>
					<p
						id={descriptionId}
						className='text-xs leading-4 wrap-anywhere text-muted-foreground'
					>
						{title} · {currentColor.label}
					</p>
				</div>
				<ChoiceGroup
					aria-label={`Цвет колонки «${title}»`}
					value={column.color}
					disabled={disabled}
					className='grid grid-cols-4 gap-x-2 gap-y-3'
					onValueChange={(color) => {
						onChange(color as BoardColumnColor)
						setOpen(false)
					}}
				>
					{Object.entries(columnColors).map(([value, option]) => (
						<ChoiceGroupItem
							key={value}
							value={value}
							className='min-w-0 justify-center gap-0 border-0 bg-transparent p-0 text-center whitespace-nowrap shadow-none hover:bg-transparent data-[state=checked]:border-transparent data-[state=checked]:bg-transparent data-[state=checked]:ring-0 data-[state=checked]:focus-visible:ring-[3px] dark:border-0 dark:bg-transparent dark:hover:bg-transparent dark:data-[state=checked]:border-transparent dark:data-[state=checked]:bg-transparent [&>span]:w-full [&>span]:wrap-normal [&>span]:whitespace-nowrap [&>svg]:hidden'
						>
							<span
								aria-hidden
								className={cn(
									'mx-auto flex size-10 items-center justify-center rounded-lg border-2 border-transparent',
									option.className,
									column.color === value && 'border-foreground',
								)}
							>
								{column.color === value && (
									<Check className='size-5 text-primary-foreground' />
								)}
							</span>
							<span className='relative left-1/2 mt-1 block w-max -translate-x-1/2 text-xs leading-4 whitespace-nowrap'>
								{option.label}
							</span>
						</ChoiceGroupItem>
					))}
				</ChoiceGroup>
				<p className='text-xs leading-4 text-muted-foreground'>
					{column.isNew
						? 'Цвет обновит черновик колонки. Колонка добавится после «Сохранить изменения».'
						: 'Цвет применится после сохранения настроек.'}
				</p>
			</PopoverContent>
		</Popover>
	)
}
