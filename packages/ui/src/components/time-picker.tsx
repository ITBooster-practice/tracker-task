'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ClockIcon } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { normalizeTime, pad } from '../lib/date-time'

export interface TimePickerProps {
	value: string
	onChange: (value: string) => void
	id?: string
	label?: string
	action?: ReactNode
	disabled?: boolean
	required?: boolean
	// Включительные границы времени ЧЧ:ММ для выбранного дня.
	min?: string
	max?: string
}

export function TimePicker({
	value,
	onChange,
	id,
	label = 'Время',
	action,
	disabled,
	required,
	min,
	max,
}: TimePickerProps) {
	const generatedId = useId()
	const inputId = id ?? generatedId
	const input = useRef<HTMLInputElement>(null)
	const [draft, setDraft] = useState(value)
	const [dirty, setDirty] = useState(false)
	const [open, setOpen] = useState(false)
	const [error, setError] = useState('')
	const errorFor = (text: string) => {
		const time = normalizeTime(text)
		if (!time) return 'Введите время в формате ЧЧ:ММ.'
		if (min && time < min) return 'Выберите время не раньше ' + min + '.'
		if (max && time > max) return 'Выберите время не позже ' + max + '.'
		return ''
	}
	useEffect(() => {
		setDraft(value)
		setDirty(false)
		setError('')
		input.current?.setCustomValidity('')
	}, [value])
	const revalidate = useRef<() => void>(() => {})
	revalidate.current = () => {
		if (!dirty) return
		const message = errorFor(draft)
		setError(message)
		input.current?.setCustomValidity(message)
	}
	// Перепроверяем ввод по мере изменения времени сервера; сохранённый прошедший срок не блокирует другие изменения.
	useEffect(() => {
		revalidate.current()
	}, [min, max])
	const edit = (text: string, finish = false) => {
		setDraft(text)
		setDirty(true)
		const message = errorFor(text)
		setError(message)
		input.current?.setCustomValidity(message)
		if (!message) {
			const time = normalizeTime(text)!
			onChange(time)
			if (finish) setDraft(time)
		}
	}
	const [hours = '00', minutes = '00'] = value.split(':')
	const allowed = (time: string) => (!min || time >= min) && (!max || time <= max)
	return (
		<div className='grid gap-2'>
			<Label htmlFor={inputId}>{label}</Label>
			<div className='flex items-center gap-2'>
				<div className='relative min-w-0 flex-1'>
					<Input
						ref={input}
						id={inputId}
						type='text'
						inputMode='numeric'
						placeholder='ЧЧ:ММ'
						value={draft}
						disabled={disabled}
						required={required}
						className='pr-11'
						aria-invalid={Boolean(error)}
						aria-describedby={error ? inputId + '-error' : undefined}
						onChange={(event) => edit(event.target.value)}
						onBlur={() => {
							if (dirty) edit(draft, true)
						}}
						onKeyDown={(event) => {
							if (event.key === 'Enter') {
								event.preventDefault()
								edit(draft, true)
							}
						}}
					/>
					<Popover open={open} onOpenChange={setOpen}>
						<PopoverTrigger asChild>
							<Button
								type='button'
								variant='ghost'
								size='icon'
								disabled={disabled}
								className='absolute top-0 right-0 cursor-pointer'
								aria-label='Выбрать время'
							>
								<ClockIcon aria-hidden='true' />
							</Button>
						</PopoverTrigger>
						<PopoverContent align='end' className='w-56'>
							<div className='flex items-end gap-2'>
								<div className='grid flex-1 gap-2'>
									<Label htmlFor={inputId + '-hours'}>Часы</Label>
									<Select
										value={hours}
										onValueChange={(hour) => {
											let next = hour + ':' + minutes
											if (min && next < min) next = min
											if (max && next > max) next = max
											edit(next, true)
										}}
									>
										<SelectTrigger id={inputId + '-hours'} className='w-full'>
											<SelectValue />
										</SelectTrigger>
										<SelectContent position='popper' className='h-60'>
											{Array.from({ length: 24 }, (_, i) => pad(i)).map((hour) => (
												<SelectItem
													key={hour}
													value={hour}
													disabled={
														(Boolean(min) && hour + ':59' < min!) ||
														(Boolean(max) && hour + ':00' > max!)
													}
												>
													{hour}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<span className='pb-2' aria-hidden='true'>
									:
								</span>
								<div className='grid flex-1 gap-2'>
									<Label htmlFor={inputId + '-minutes'}>Минуты</Label>
									<Select
										value={minutes}
										onValueChange={(minute) => edit(hours + ':' + minute, true)}
									>
										<SelectTrigger id={inputId + '-minutes'} className='w-full'>
											<SelectValue />
										</SelectTrigger>
										<SelectContent position='popper' className='h-60'>
											{Array.from({ length: 60 }, (_, i) => pad(i)).map((minute) => (
												<SelectItem
													key={minute}
													value={minute}
													disabled={!allowed(hours + ':' + minute)}
												>
													{minute}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
							<Button
								type='button'
								size='sm'
								className='mt-3 w-full'
								onClick={() => setOpen(false)}
							>
								Готово
							</Button>
						</PopoverContent>
					</Popover>
				</div>
				{action}
			</div>
			{error && (
				<p id={inputId + '-error'} role='alert' className='text-sm text-destructive'>
					{error}
				</p>
			)}
		</div>
	)
}
