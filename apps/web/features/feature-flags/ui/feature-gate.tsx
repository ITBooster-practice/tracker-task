'use client'

import { type PropsWithChildren } from 'react'

import { Button, Skeleton } from '@repo/ui'

import { useFeatureFlags } from '@/shared/lib/feature-flags/context'
import { hasFeature } from '@/shared/lib/feature-flags/feature-flags'

export function FeatureGate({
	feature,
	children,
}: PropsWithChildren<{ feature: string }>) {
	const state = useFeatureFlags()
	if (state.status === 'loading')
		return (
			<div role='status' aria-label='Загрузка доступных функций' className='p-6'>
				<Skeleton className='h-24 w-full' />
			</div>
		)
	if (state.status === 'error')
		return (
			<div role='alert' className='space-y-3 p-6'>
				<p>Не удалось проверить доступность раздела.</p>
				<Button onClick={state.retry}>Повторить</Button>
			</div>
		)
	if (!hasFeature(state.snapshot, feature))
		return (
			<div role='status' className='p-6'>
				<h1 className='text-xl font-semibold'>Раздел временно недоступен</h1>
				<p className='mt-2 text-muted-foreground'>
					Доступ к этому разделу отключён разработчиком системы.
				</p>
			</div>
		)
	return children
}
