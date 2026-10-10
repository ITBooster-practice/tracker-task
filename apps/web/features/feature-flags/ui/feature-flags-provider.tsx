'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type PropsWithChildren } from 'react'

import type { FeatureFlagsSnapshot } from '@repo/types'

import { featureFlagsKeys } from '@/shared/api/use-feature-flags'
import {
	FeatureFlagsContext,
	type FeatureFlagsState,
} from '@/shared/lib/feature-flags/context'
import { getDevelopmentSnapshot } from '@/shared/lib/feature-flags/feature-flags'
import { featureFlagsService } from '@/shared/lib/feature-flags/feature-flags-service'
import { subscribeToFeatureFlags } from '@/shared/lib/feature-flags/subscribe'

export function FeatureFlagsProvider({ children }: PropsWithChildren) {
	const queryClient = useQueryClient()
	const [connection, setConnection] =
		useState<FeatureFlagsState['connection']>('connecting')
	const snapshot = useQuery({
		queryKey: featureFlagsKeys.snapshot,
		queryFn: ({ signal }) =>
			featureFlagsService.snapshot(
				queryClient.getQueryData<FeatureFlagsSnapshot>(featureFlagsKeys.snapshot),
				signal,
			),
		retry: 1,
		staleTime: Infinity,
	})
	const access = useQuery({
		queryKey: featureFlagsKeys.access,
		queryFn: ({ signal }) => featureFlagsService.access(signal),
		retry: false,
		staleTime: Infinity,
	})
	useEffect(
		() =>
			subscribeToFeatureFlags({
				onConnection: setConnection,
				refresh: async () => {
					await queryClient.invalidateQueries(
						{ queryKey: featureFlagsKeys.snapshot, exact: true },
						{ throwOnError: true },
					)
					await queryClient.invalidateQueries({
						queryKey: featureFlagsKeys.access,
						exact: true,
					})
				},
				onChange: (version) => {
					const current = queryClient.getQueryData<FeatureFlagsSnapshot>(
						featureFlagsKeys.snapshot,
					)
					if (current && current.version >= version) return
					void queryClient.invalidateQueries({ queryKey: featureFlagsKeys.all })
				},
			}),
		[queryClient],
	)
	const fallback = snapshot.isError ? getDevelopmentSnapshot() : undefined
	const status = fallback
		? 'ready'
		: snapshot.isError
			? 'error'
			: snapshot.data
				? 'ready'
				: 'loading'
	return (
		<FeatureFlagsContext.Provider
			value={{
				snapshot: fallback ?? snapshot.data ?? null,
				status,
				connection,
				canManage: !access.isError && Boolean(access.data?.canManage),
				retry: () => {
					void queryClient.invalidateQueries({ queryKey: featureFlagsKeys.all })
				},
			}}
		>
			{snapshot.isError && !fallback && (
				<div role='alert' className='border-b bg-muted p-3 text-sm'>
					Не удалось загрузить доступные функции.{' '}
					<button
						type='button'
						className='underline'
						onClick={() =>
							void queryClient.invalidateQueries({ queryKey: featureFlagsKeys.all })
						}
					>
						Повторить
					</button>
				</div>
			)}
			{connection === 'reconnecting' && !snapshot.isError && (
				<div role='status' className='border-b bg-muted p-2 text-sm'>
					Восстанавливаем обновления приложения…
				</div>
			)}
			{fallback && (
				<div role='status' className='border-b bg-muted p-2 text-sm'>
					Режим локальной разработки
				</div>
			)}
			{children}
		</FeatureFlagsContext.Provider>
	)
}
