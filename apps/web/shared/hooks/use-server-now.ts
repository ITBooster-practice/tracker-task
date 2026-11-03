'use client'

import { useSyncExternalStore } from 'react'

import { getServerNow, subscribeServerClock } from '@/shared/lib/server-clock'

const getServerSnapshot = () => 0

export function useServerNow() {
	return useSyncExternalStore(subscribeServerClock, getServerNow, getServerSnapshot)
}
