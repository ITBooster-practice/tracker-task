import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { useWorkspaceStore } from '@/shared/lib/workspace-context/store'

import type { UserStore } from '../types'

export const useUserStore = create<UserStore>()(
	persist(
		(set) => ({
			user: null,
			sessionVersion: 0,
			sessionEnded: false,
			setUser: (user) => {
				if (useWorkspaceStore.getState().hydrated)
					useWorkspaceStore.getState().bindAccount(user.id)
				set({ user, sessionEnded: false })
			},
			clearUser: () => {
				useWorkspaceStore.getState().clear()
				set((state) => ({
					user: null,
					sessionEnded: true,
					sessionVersion: state.sessionVersion + 1,
				}))
			},
			startSession: () => set({ sessionEnded: false }),
		}),
		{ name: 'user-storage', partialize: ({ user }) => ({ user }) },
	),
)
