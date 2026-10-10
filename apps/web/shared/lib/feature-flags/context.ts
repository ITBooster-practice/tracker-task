'use client'

import { createContext, useContext } from 'react'

import type { FeatureFlagsSnapshot } from '@repo/types'

import { hasFeature } from './feature-flags'

export interface FeatureFlagsState {
	snapshot: FeatureFlagsSnapshot | null
	status: 'loading' | 'ready' | 'error'
	connection: 'connecting' | 'connected' | 'reconnecting'
	canManage: boolean
	retry: () => void
}
export const FeatureFlagsContext = createContext<FeatureFlagsState>({
	snapshot: null,
	status: 'loading',
	connection: 'connecting',
	canManage: false,
	retry: () => {},
})
export const useFeatureFlags = () => useContext(FeatureFlagsContext)
export function useFeature(key: string): boolean {
	const state = useFeatureFlags()
	return state.status === 'ready' && hasFeature(state.snapshot, key)
}
