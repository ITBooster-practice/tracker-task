'use client'

import { createContext, useContext, useState, type PropsWithChildren } from 'react'
import { useStore } from 'zustand'

import { createSideBarStore } from './store'

export const SidebarStoreContext = createContext<ReturnType<
	typeof createSideBarStore
> | null>(null)

export function SidebarStateProvider({
	initialOpen = true,
	children,
}: PropsWithChildren<{ initialOpen?: boolean }>) {
	const [store] = useState(() => createSideBarStore(initialOpen))
	return (
		<SidebarStoreContext.Provider value={store}>{children}</SidebarStoreContext.Provider>
	)
}

export function useSideBarStore() {
	const store = useContext(SidebarStoreContext)
	if (!store) throw new Error('SidebarStateProvider is required')
	return useStore(store)
}
