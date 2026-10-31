import { persist } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'

import {
	readClientSidebarOpen,
	SIDEBAR_COOKIE_NAME,
	writeSidebarCookie,
} from './preference'
import type { SideBarStore } from './types'

export const createSideBarStore = (initialOpen = true) =>
	createStore<SideBarStore>()(
		persist(
			(set) => ({
				isOpen: initialOpen,
				open: () => set({ isOpen: true }),
				close: () => set({ isOpen: false }),
				toggle: () => set((state) => ({ isOpen: !state.isOpen })),
			}),
			{
				name: SIDEBAR_COOKIE_NAME,
				storage: {
					getItem: () => ({
						state: {
							isOpen:
								typeof document === 'undefined'
									? initialOpen
									: readClientSidebarOpen(initialOpen),
						},
						version: 0,
					}),
					setItem: (_name, value) => writeSidebarCookie(value.state.isOpen),
					removeItem: () => writeSidebarCookie(undefined),
				},
				partialize: ({ isOpen }) => ({ isOpen }),
			},
		),
	)
