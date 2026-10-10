'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { featureFlagsService } from './feature-flags-service'

const REFRESH_INTERVAL = 60_000
const TICK_INTERVAL = 1_000

// Между запросами отсчитываем время сервера через performance.now(), независимо от часов компьютера.
export function useServerClock() {
	const [now, setNow] = useState<Date | null>(null)
	const query = useQuery({
		queryKey: ['feature-flags', 'server-time'],
		queryFn: async ({ signal }) => {
			const started = performance.now()
			const { serverTime } = await featureFlagsService.serverTime(signal)
			const received = performance.now()
			return {
				milliseconds: new Date(serverTime).getTime() + (received - started) / 2,
				received,
			}
		},
		staleTime: REFRESH_INTERVAL,
		refetchInterval: REFRESH_INTERVAL,
		retry: false,
	})
	useEffect(() => {
		if (!query.data || query.isError) {
			setNow(null)
			return
		}
		const anchor = query.data
		const update = () =>
			setNow(new Date(anchor.milliseconds + performance.now() - anchor.received))
		update()
		const interval = setInterval(update, TICK_INTERVAL)
		return () => clearInterval(interval)
	}, [query.data, query.isError])
	return { now, isError: query.isError, retry: query.refetch }
}
