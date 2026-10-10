'use client'

import { Button, DateTimePicker } from '@repo/ui'

import { useServerClock } from '@/shared/lib/feature-flags/use-server-clock'

interface Props {
	value: string
	onChange: (value: string) => void
	disabled: boolean
	now: ReturnType<typeof useServerClock>['now']
	isError: boolean
	retry: () => unknown
}

export function FeatureFlagDeadline({
	value,
	onChange,
	disabled,
	now,
	isError,
	retry,
}: Props) {
	return (
		<div className='grid gap-2'>
			<DateTimePicker
				id='flag-expires'
				label='Плановая дата завершения'
				timeLabel='Время завершения'
				withTime
				value={value}
				onChange={onChange}
				disabled={disabled || !now}
				minValue={now ?? undefined}
				referenceDate={now ?? undefined}
				description='Напоминание для разработчика. Дата и время указаны в вашем часовом поясе и не переключают флаг автоматически. Новая дата не может быть раньше текущего времени сервера.'
			/>
			{!now && (
				<p role={isError ? 'alert' : 'status'} className='text-sm text-muted-foreground'>
					{isError ? 'Не удалось получить время сервера.' : 'Получаем время сервера…'}
				</p>
			)}
			{isError && (
				<Button
					type='button'
					variant='outline'
					size='sm'
					className='w-fit'
					disabled={disabled}
					onClick={() => void retry()}
				>
					Повторить
				</Button>
			)}
		</div>
	)
}
