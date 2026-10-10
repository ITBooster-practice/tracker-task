'use client'

import { useState } from 'react'

import {
	Button,
	Calendar,
	cn,
	Input,
	Label,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@repo/ui'
import { CalendarDays } from '@repo/ui/icons'

interface Props {
	value: string
	onChange: (value: string) => void
	disabled: boolean
}

export function FeatureFlagDeadline({ value, onChange, disabled }: Props) {
	const [open, setOpen] = useState(false)
	const selected = value ? new Date(value.split('T')[0] + 'T00:00') : undefined
	const time = value.split('T')[1] ?? '00:00'

	return (
		<div className='grid gap-2'>
			<Label htmlFor='flag-expires'>Плановая дата завершения</Label>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						id='flag-expires'
						type='button'
						variant='outline'
						disabled={disabled}
						aria-describedby='flag-expires-hint'
						className={cn(
							'w-full cursor-pointer justify-start font-normal',
							!selected && 'text-muted-foreground',
						)}
					>
						<CalendarDays aria-hidden='true' />
						{selected ? selected.toLocaleDateString('ru-RU') : 'Выберите дату'}
					</Button>
				</PopoverTrigger>
				<PopoverContent className='w-auto p-0' align='start'>
					<Calendar
						mode='single'
						selected={selected}
						defaultMonth={selected}
						autoFocus
						onSelect={(day) => {
							if (day) {
								const localDay = [
									day.getFullYear(),
									String(day.getMonth() + 1).padStart(2, '0'),
									String(day.getDate()).padStart(2, '0'),
								].join('-')
								onChange(localDay + 'T' + time)
							} else onChange('')
							setOpen(false)
						}}
					/>
				</PopoverContent>
			</Popover>
			{selected && (
				<div className='flex items-end gap-2'>
					<div className='grid flex-1 gap-2'>
						<Label htmlFor='flag-expires-time'>Время завершения</Label>
						<Input
							id='flag-expires-time'
							type='time'
							value={time}
							required
							disabled={disabled}
							onChange={(event) =>
								onChange(value.split('T')[0] + 'T' + event.target.value)
							}
						/>
					</div>
					<Button
						type='button'
						variant='ghost'
						disabled={disabled}
						onClick={() => onChange('')}
					>
						Убрать дату
					</Button>
				</div>
			)}
			<p id='flag-expires-hint' className='text-sm text-muted-foreground'>
				Напоминание для разработчика. Дата и время указаны в вашем часовом поясе и не
				переключают флаг автоматически.
			</p>
		</div>
	)
}
