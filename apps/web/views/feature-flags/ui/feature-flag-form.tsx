'use client'

import { useState } from 'react'

import {
	createFeatureFlagSchema,
	type CreateFeatureFlag,
	type FeatureFlag,
} from '@repo/types'
import { Button, Checkbox, Input, Label, parseLocalDateTime, Textarea } from '@repo/ui'

import { useServerClock } from '@/shared/lib/feature-flags/use-server-clock'

import { FeatureFlagDeadline } from './feature-flag-deadline'

interface Props {
	flag: FeatureFlag | null
	pending: boolean
	error: string
	onSubmit: (value: CreateFeatureFlag) => Promise<void>
	onCancel: () => void
}
function localDate(value: string | null) {
	if (!value) return ''
	const date = new Date(value)
	return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
		.toISOString()
		.slice(0, 16)
}
const sections: Record<string, string> = {
	projects: 'Проекты',
	tasks: 'Задачи',
	boards: 'Доски',
	'team-settings': 'Настройки команды',
}
export function FeatureFlagForm({ flag, pending, error, onSubmit, onCancel }: Props) {
	const [key, setKey] = useState(flag?.key ?? '')
	const [title, setTitle] = useState(flag?.title ?? '')
	const [description, setDescription] = useState(flag?.description ?? '')
	const [enabled, setEnabled] = useState(flag?.enabled ?? false)
	const [expiresAt, setExpiresAt] = useState(localDate(flag?.expiresAt ?? null))
	const [validation, setValidation] = useState('')
	const clock = useServerClock()
	const unchangedDeadline = expiresAt === localDate(flag?.expiresAt ?? null)
	const section = sections[key]
	return (
		<form
			className='grid gap-4'
			onSubmit={async (event) => {
				event.preventDefault()
				const plannedDate = expiresAt ? parseLocalDateTime(expiresAt) : null
				if (expiresAt && !plannedDate) {
					setValidation('Укажите корректную дату и время завершения.')
					return
				}
				if (
					plannedDate &&
					!unchangedDeadline &&
					(!clock.now || plannedDate < clock.now)
				) {
					setValidation(
						clock.now
							? 'Дата и время не могут быть раньше текущего времени сервера.'
							: 'Дождитесь загрузки времени сервера.',
					)
					return
				}
				const parsed = createFeatureFlagSchema.safeParse({
					key,
					title,
					description: description.trim() || null,
					enabled,
					expiresAt: unchangedDeadline
						? (flag?.expiresAt ?? null)
						: (plannedDate?.toISOString() ?? null),
				})
				if (!parsed.success) {
					setValidation(parsed.error.issues.map((issue) => issue.message).join('; '))
					return
				}
				if (!event.currentTarget.checkValidity()) {
					setValidation('Укажите корректную дату и время завершения.')
					return
				}
				setValidation('')
				await onSubmit(parsed.data)
			}}
		>
			<div className='grid gap-2'>
				<Label htmlFor='flag-key'>Технический ключ</Label>
				<Input
					id='flag-key'
					value={key}
					onChange={(event) => setKey(event.target.value)}
					required
					maxLength={80}
					readOnly={Boolean(flag)}
					disabled={pending}
					pattern='[a-z][a-z0-9]*(-[a-z0-9]+)*'
					aria-describedby='flag-key-hint'
				/>
				<p id='flag-key-hint' className='text-sm text-muted-foreground'>
					Латинские буквы, цифры и дефисы. Ключ нельзя изменить или использовать повторно
					после архивации. Для нового ключа создайте флаг, переведите проверки в коде и
					завершите поддержку старого.
				</p>
			</div>
			<div className='grid gap-2'>
				<Label htmlFor='flag-title'>Название</Label>
				<Input
					id='flag-title'
					value={title}
					onChange={(event) => setTitle(event.target.value)}
					required
					maxLength={100}
					disabled={pending}
				/>
			</div>
			<div className='grid gap-2'>
				<Label htmlFor='flag-description'>Описание и план завершения</Label>
				<Textarea
					id='flag-description'
					value={description}
					onChange={(event) => setDescription(event.target.value)}
					maxLength={1000}
					disabled={pending}
				/>
			</div>
			<FeatureFlagDeadline
				value={expiresAt}
				onChange={setExpiresAt}
				disabled={pending}
				now={clock.now}
				isError={clock.isError}
				retry={clock.retry}
			/>
			<div className='grid gap-2'>
				<div className='flex items-center gap-2'>
					<Checkbox
						id='flag-enabled'
						checked={enabled}
						onCheckedChange={(checked) => setEnabled(checked === true)}
						disabled={pending}
						aria-describedby='flag-enabled-hint'
					/>
					<Label htmlFor='flag-enabled' className='cursor-pointer'>
						Функция включена
					</Label>
				</div>
				<p id='flag-enabled-hint' className='text-sm text-muted-foreground'>
					{section
						? 'После сохранения включит раздел «' +
							section +
							'» (ключ ' +
							key +
							') для пользователей с правами на него. Снятая отметка закроет раздел и его API. Другие необходимые флаги также должны быть включены.'
						: 'Этот чекбокс задаёт состояние флага' +
							(key ? ' «' + key + '»' : '') +
							'. Доступ изменится только к той функции, для которой разработчик добавит проверки этого ключа в код frontend и API. Создание флага само по себе не подключает его к разделу приложения.'}
				</p>
			</div>
			{(validation || error) && (
				<p role='alert' className='text-sm text-destructive'>
					{validation || error}
				</p>
			)}
			<div className='flex gap-2'>
				<Button type='submit' disabled={pending}>
					{pending ? 'Сохранение…' : 'Сохранить'}
				</Button>
				<Button type='button' variant='outline' disabled={pending} onClick={onCancel}>
					Отмена
				</Button>
			</div>
		</form>
	)
}
