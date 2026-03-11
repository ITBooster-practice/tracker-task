import { create } from 'zustand'

import type { Theme, ThemeStore } from '../types/theme'

export const useThemeStore = create<ThemeStore>((set) => ({
	theme: 'dark',
	setTheme: (theme: Theme) => set({ theme }),
	toggleTheme: () =>
		set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
}))
