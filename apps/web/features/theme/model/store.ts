import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { Theme, ThemeStore } from '../types/theme'

export const useThemeStore = create<ThemeStore>()(
	persist(
		(set) => ({
			theme: 'dark',
			setTheme: (theme: Theme) => set({ theme }),
			toggleTheme: () =>
				set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
		}),
		{ name: 'theme' },
	),
)
