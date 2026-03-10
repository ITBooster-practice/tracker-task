'use client'

import { create } from 'zustand'

export type SessionStatus = 'unknown' | 'authenticated' | 'guest'

type SessionStore = {
	status: SessionStatus
	accessToken: string | null
	isInitialized: boolean
	setAuthenticated: (accessToken: string) => void
	setGuest: () => void
	clear: () => void
}

export const useSessionStore = create<SessionStore>((set) => ({
	status: 'unknown',
	accessToken: null,
	isInitialized: false,

	setAuthenticated: (accessToken) =>
		set({
			status: 'authenticated',
			accessToken,
			isInitialized: true,
		}),

	setGuest: () =>
		set({
			status: 'guest',
			accessToken: null,
			isInitialized: true,
		}),

	clear: () =>
		set({
			status: 'guest',
			accessToken: null,
			isInitialized: true,
		}),
}))
