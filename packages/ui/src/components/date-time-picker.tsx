'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { Button } from './button'
import { Calendar } from './calendar'
import { CalendarMonthYear } from './calendar-month-year'
import { Input } from './input'
import { Label } from './label'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { TimePicker } from './time-picker'
import {
	displayDay,
	formatDayInput,
	localDay,
	localTime,
	minuteCeiling,
	parseDayInput,
	parseLocalDateTime,
} from '../lib/date-time'

export interface DateTimePickerProps {
	// Местные дата YYYY-MM-DD или дата и время YYYY-MM-DDTHH:mm; пустая строка убирает значение.
	value: string
	onChange: (value: string) => void
	withTime?: boolean
	id?: string
	label?: string
	timeLabel?: string
	disabled?: boolean
	required?: boolean
	minValue?: Date
	maxValue?: Date
	// Источник текущей даты и начального месяца, например время API.
	referenceDate?: Date
	startYear?: number
	endYear?: number
	description?: string
}

export function DateTimePicker({
	value,
	onChange,
	withTime = false,
	id,
	label = 'Дата',
	timeLabel = 'Время',
	disabled,
	required,
	minValue,
	maxValue,
	referenceDate,
	startYear,
	endYear,
	description,
}: DateTimePickerProps) {
	const generatedId = useId()
	const inputId = id ?? generatedId
	const input = useRef<HTMLInputElement>(null)
	const today = referenceDate ?? new Date()
	const selected = parseLocalDateTime(value)
	const lower = minValue ? (withTime ? minuteCeiling(minValue) : minValue) : undefined
	const upper = maxValue
	const start = new Date(
		startYear ?? lower?.getFullYear() ?? today.getFullYear() - 100,
		startYear === undefined && lower ? lower.getMonth() : 0,
	)
	const end = new Date(
		endYear ?? upper?.getFullYear() ?? today.getFullYear() + 20,
		endYear === undefined && upper ? upper.getMonth() : 11,
	)
	const [month, setMonth] = useState(selected ?? lower ?? today)
	const [open, setOpen] = useState(false)
	const [draft, setDraft] = useState(displayDay(value))
	const [dirty, setDirty] = useState(false)
	const [error, setError] = useState('')
	const initialMonth = () => {
		const candidate = selected ?? lower ?? today
		return candidate < start ? start : candidate > end ? end : candidate
	}
	const choose = (day: string): { value: string; error: string } => {
		if ((lower && day < localDay(lower)) || day < localDay(start))
			return {
				value: '',
				error: 'Выберите дату не раньше ' + displayDay(localDay(lower ?? start)) + '.',
			}
		if (
			(upper && day > localDay(upper)) ||
			day > localDay(new Date(end.getFullYear(), 11, 31))
		)
			return { value: '', error: 'Дата выходит за допустимый диапазон.' }
		let next = day
		if (withTime) {
			next += 'T' + (value.split('T')[1] || '00:00')
			if (lower && new Date(next) < lower) next = day + 'T' + localTime(lower)
			if (upper && new Date(next) > upper) next = day + 'T' + localTime(upper)
		}
		const parsed = parseLocalDateTime(next)
		if (!parsed) return { value: '', error: 'Укажите корректную дату и время.' }
		if (withTime && ((lower && parsed < lower) || (upper && parsed > upper)))
			return { value: '', error: 'Для этой даты нет времени в допустимом диапазоне.' }
		return { value: next, error: '' }
	}
	useEffect(() => {
		setDraft(displayDay(value))
		setDirty(false)
		setError('')
		input.current?.setCustomValidity('')
	}, [value])
	const edit = (text: string, finish = false) => {
		setDraft(text)
		setDirty(true)
		const day = parseDayInput(text)
		const result = !text.trim()
			? { value: '', error: '' }
			: day
				? choose(day)
				: { value: '', error: 'Введите дату в формате ДД.ММ.ГГГГ.' }
		setError(result.error)
		input.current?.setCustomValidity(result.error)
		if (!result.error) {
			onChange(result.value)
			if (day) setMonth(parseLocalDateTime(day)!)
			if (finish) setDraft(displayDay(result.value))
		}
	}
	const revalidate = useRef<() => void>(() => {})
	revalidate.current = () => {
		if (dirty) edit(draft)
	}
	const minTimestamp = minValue?.getTime()
	const maxTimestamp = maxValue?.getTime()
	// Перепроверяем ввод при изменении минимума, сохраняя возможность редактировать флаг с уже прошедшим сроком.
	useEffect(() => {
		revalidate.current()
	}, [minTimestamp, maxTimestamp])
	const timeMin =
		selected && lower && localDay(selected) === localDay(lower)
			? localTime(lower)
			: undefined
	const timeMax =
		selected && upper && localDay(selected) === localDay(upper)
			? localTime(upper)
			: undefined
	const clearButton = value && (
		<Button
			type='button'
			variant='ghost'
			size='sm'
			className='w-fit shrink-0'
			disabled={disabled}
			onClick={() => onChange('')}
		>
			Очистить дату
		</Button>
	)
	return (
		<div className='grid gap-2'>
			<Label htmlFor={inputId}>{label}</Label>
			<div className='relative'>
				<Input
					ref={input}
					id={inputId}
					type='text'
					inputMode='numeric'
					placeholder='ДД.ММ.ГГГГ'
					value={draft}
					required={required}
					disabled={disabled}
					className='pr-11'
					aria-invalid={Boolean(error)}
					aria-describedby={
						[description && inputId + '-hint', error && inputId + '-error']
							.filter(Boolean)
							.join(' ') || undefined
					}
					onChange={(event) => {
						const field = event.currentTarget
						const raw = field.value
						const position = field.selectionStart ?? raw.length
						const formatted = formatDayInput(raw)
						const digitsBeforeCursor = raw.slice(0, position).replace(/\D/g, '').length
						let cursor = formatted.length
						if (position !== raw.length) {
							cursor = 0
							let digits = 0
							while (cursor < formatted.length && digits < digitsBeforeCursor) {
								if (/\d/.test(formatted[cursor]!)) digits++
								cursor++
							}
						}
						edit(formatted)
						// Восстанавливаем курсор после вставки точек, чтобы можно было редактировать середину даты.
						queueMicrotask(() => {
							if (field.isConnected && document.activeElement === field)
								field.setSelectionRange(cursor, cursor)
						})
					}}
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
				<Popover
					open={open}
					onOpenChange={(next) => {
						if (next) setMonth(initialMonth())
						setOpen(next)
					}}
				>
					<PopoverTrigger asChild>
						<Button
							type='button'
							variant='ghost'
							size='icon'
							disabled={disabled}
							className='absolute top-0 right-0 cursor-pointer'
							aria-label='Выбрать дату'
						>
							<CalendarIcon aria-hidden='true' />
						</Button>
					</PopoverTrigger>
					<PopoverContent align='end' className='w-auto p-0'>
						<Calendar
							mode='single'
							selected={selected ?? undefined}
							month={month}
							onMonthChange={setMonth}
							today={today}
							startMonth={start}
							endMonth={end}
							className='[--cell-size:2.5rem]'
							components={{ MonthCaption: CalendarMonthYear }}
							disabled={[
								...(lower
									? [
											{
												before: new Date(
													lower.getFullYear(),
													lower.getMonth(),
													lower.getDate(),
												),
											},
										]
									: []),
								...(upper
									? [
											{
												after: new Date(
													upper.getFullYear(),
													upper.getMonth(),
													upper.getDate(),
												),
											},
										]
									: []),
							]}
							onSelect={(day) => {
								const result = day ? choose(localDay(day)) : { value: '', error: '' }
								if (!result.error) {
									onChange(result.value)
									setError('')
									input.current?.setCustomValidity('')
									setOpen(false)
								}
							}}
						/>
					</PopoverContent>
				</Popover>
			</div>
			{error && (
				<p id={inputId + '-error'} role='alert' className='text-sm text-destructive'>
					{error}
				</p>
			)}
			{selected && withTime && (
				<TimePicker
					id={inputId + '-time'}
					label={timeLabel}
					action={clearButton}
					value={value.split('T')[1] ?? '00:00'}
					min={timeMin}
					max={timeMax}
					disabled={
						disabled ||
						Boolean(selected && lower && localDay(selected) < localDay(lower)) ||
						Boolean(selected && upper && localDay(selected) > localDay(upper))
					}
					required
					onChange={(time) => onChange(localDay(selected) + 'T' + time)}
				/>
			)}
			{!(selected && withTime) && clearButton}
			{description && (
				<p id={inputId + '-hint'} className='text-sm text-muted-foreground'>
					{description}
				</p>
			)}
		</div>
	)
}
