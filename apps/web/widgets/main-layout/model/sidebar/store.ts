import { create } from 'zustand'

import type { SideBarStore } from './types'

export const useSideBarStore = create<SideBarStore>((set) => ({
	isOpen: true,
	open: () => set({ isOpen: true }),
	close: () => set({ isOpen: false }),
	toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}))
