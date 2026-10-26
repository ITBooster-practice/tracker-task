'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import type { UpdateFeatureFlag } from '@repo/types'
import {
	Button,
	cn,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@repo/ui'

import { featureFlagsKeys, useFeatureFlagsList } from '@/shared/api/use-feature-flags'
import { isApiError } from '@/shared/lib/api/utils'
import { useFeatureFlags } from '@/shared/lib/feature-flags/context'
import { featureFlagsService } from '@/shared/lib/feature-flags/feature-flags-service'

import { FeatureFlagStatus } from './feature-flag-status'
import { FeatureFlagsAccessDenied } from './feature-flags-access-denied'

export function FeatureFlagsPageView() {
	const { canManage } = useFeatureFlags()
	const queryClient = useQueryClient()
	const list = useFeatureFlagsList(canManage)
	const [search, setSearch] = useState('')
	const [filter, setFilter] = useState('all')
	const [error, setError] = useState('')
	const mutation = useMutation({
		mutationFn: ({ id, ...body }: UpdateFeatureFlag & { id: string }) =>
			featureFlagsService.update(id, body),
		onSuccess: async () => {
			setError('')
			await queryClient.invalidateQueries({ queryKey: featureFlagsKeys.all })
		},
		onError: (cause) => {
			setError(
				isApiError(cause) && cause.statusCode === 409
					? 'Флаги уже изменились. Список обновлён; проверьте состояние и повторите действие.'
					: isApiError(cause) && cause.statusCode === 403
						? 'Право управления недоступно.'
						: isApiError(cause) && cause.statusCode === 422
							? cause.message
							: 'Не удалось изменить состояние. Повторите попытку.',
			)
			if (isApiError(cause) && cause.statusCode === 403)
				queryClient.setQueryData(featureFlagsKeys.access, { canManage: false })
			void queryClient.invalidateQueries({ queryKey: featureFlagsKeys.all })
		},
	})
	if (!canManage) return <FeatureFlagsAccessDenied />
	const flags = (list.data?.flags ?? []).filter((flag) => {
		const matches = (flag.key + ' ' + (flag.connectedFeature ?? ''))
			.toLowerCase()
			.includes(search.toLowerCase())
		return (
			matches &&
			(filter === 'all' || (filter === 'enabled' ? flag.enabled : !flag.enabled))
		)
	})
	return (
		<section className='mx-auto grid w-full max-w-5xl gap-6 p-4 sm:p-6'>
			<header>
				<h1 className='text-2xl font-semibold'>Флаги функций</h1>
				<p className='text-sm text-muted-foreground'>
					Изменения применяются ко всем пользователям этого окружения.
				</p>
			</header>
			<div className='flex flex-wrap items-end gap-4'>
				<div className='grid min-w-56 flex-1 gap-2'>
					<Label htmlFor='flags-search'>Поиск по названию или ключу</Label>
					<Input
						id='flags-search'
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
				</div>
				<div className='grid gap-2'>
					<Label htmlFor='flags-filter'>Состояние</Label>
					<Select value={filter} onValueChange={setFilter}>
						<SelectTrigger id='flags-filter' className='w-44 data-[size=default]:h-9'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent position='popper' align='start'>
							<SelectItem value='all'>Все</SelectItem>
							<SelectItem value='enabled'>Включённые</SelectItem>
							<SelectItem value='disabled'>Отключённые</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>
			{error && (
				<p role='alert' className='text-destructive'>
					{error}
				</p>
			)}
			{list.isPending ? (
				<p role='status'>Загрузка флагов…</p>
			) : list.isError ? (
				<div role='alert' className='grid justify-items-start gap-3'>
					<p>Не удалось загрузить флаги.</p>
					<Button
						variant='outline'
						disabled={list.isFetching}
						onClick={() => void list.refetch()}
					>
						Повторить загрузку
					</Button>
				</div>
			) : flags.length === 0 ? (
				<p>Флаги не найдены.</p>
			) : (
				<ul className='grid gap-3'>
					{flags.map((flag) => {
						const name = flag.connectedFeature ?? flag.key
						return (
							<li
								key={flag.id}
								className={cn(
									'grid min-w-0 gap-3 rounded-lg border bg-card p-4',
									!flag.connectedFeature
										? 'border-violet-600 bg-violet-100 dark:border-violet-400 dark:bg-violet-950/60'
										: flag.enabled
											? 'border-emerald-700 bg-emerald-100 dark:border-emerald-300 dark:bg-emerald-950/60'
											: undefined,
								)}
							>
								<div className='flex flex-wrap items-start justify-between gap-3'>
									<div>
										<h2 className='font-semibold'>{name}</h2>
										<code className='text-sm text-muted-foreground'>{flag.key}</code>
									</div>
									<FeatureFlagStatus flag={flag} />
								</div>
								<p className='text-sm text-muted-foreground'>
									{flag.connectedFeature
										? 'Подключён к приложению'
										: 'Не подключён к приложению'}
								</p>
								<Button
									size='sm'
									variant='outline'
									className='w-fit'
									disabled={
										mutation.isPending ||
										list.isFetching ||
										list.isError ||
										(!flag.enabled && !flag.connectedFeature)
									}
									aria-label={(flag.enabled ? 'Выключить ' : 'Включить ') + name}
									onClick={() =>
										mutation.mutate({
											id: flag.id,
											enabled: !flag.enabled,
											expectedVersion: list.data!.version,
										})
									}
								>
									{flag.enabled ? 'Выключить' : 'Включить'}
								</Button>
							</li>
						)
					})}
				</ul>
			)}
		</section>
	)
}
