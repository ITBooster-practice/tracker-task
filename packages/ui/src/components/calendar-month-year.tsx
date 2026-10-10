'use client'

import { useDayPicker, type MonthCaptionProps } from 'react-day-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

export function CalendarMonthYear({
	calendarMonth,
	className,
	displayIndex,
	...props
}: MonthCaptionProps) {
	const { goToMonth, dayPickerProps } = useDayPicker()
	const month = calendarMonth.date
	const start = dayPickerProps.startMonth ?? new Date(month.getFullYear() - 100, 0)
	const end = dayPickerProps.endMonth ?? new Date(month.getFullYear() + 20, 11)
	const years = Array.from(
		{ length: end.getFullYear() - start.getFullYear() + 1 },
		(_, i) => start.getFullYear() + i,
	)
	const change = (year: number, index: number) => {
		const next = new Date(year, index)
		goToMonth(next < start ? start : next > end ? end : next)
	}
	return (
		<div className={className} data-month-index={displayIndex} {...props}>
			<div className='relative flex items-center gap-1'>
				<Select
					value={String(month.getMonth())}
					onValueChange={(value) => change(month.getFullYear(), Number(value))}
				>
					<SelectTrigger size='sm' className='w-[106px] gap-1 px-2' aria-label='Месяц'>
						<SelectValue />
					</SelectTrigger>
					<SelectContent position='popper' className='h-60'>
						{Array.from({ length: 12 }, (_, index) => (
							<SelectItem
								key={index}
								value={String(index)}
								disabled={
									new Date(month.getFullYear(), index + 1, 0) < start ||
									new Date(month.getFullYear(), index) > end
								}
							>
								{new Date(2000, index).toLocaleString('ru-RU', { month: 'long' })}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select
					value={String(month.getFullYear())}
					onValueChange={(value) => change(Number(value), month.getMonth())}
				>
					<SelectTrigger size='sm' className='w-[80px] gap-1 px-2' aria-label='Год'>
						<SelectValue />
					</SelectTrigger>
					<SelectContent position='popper' className='h-60'>
						{years.map((year) => (
							<SelectItem key={year} value={String(year)}>
								{year}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	)
}
