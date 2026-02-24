import { create } from 'zustand'

import type { SideBarStore } from '../types/sidebar'

export const useSideBarStore = create<SideBarStore>((set) => ({
	isOpen: false,
	open: () => set({ isOpen: true }),
	close: () => set({ isOpen: false }),
	toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}))
