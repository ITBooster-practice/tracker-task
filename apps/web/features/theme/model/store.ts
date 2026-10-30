import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import {
	applyTheme,
	DEFAULT_THEME,
	readStoredTheme,
	THEME_STORAGE_KEY,
} from '../lib/theme'
import type { Theme, ThemeStore } from '../types/theme'

export const useThemeStore = create<ThemeStore>()(
	persist(
		(set) => ({
			theme: DEFAULT_THEME,
			setTheme: (theme: Theme) => set({ theme }),
			toggleTheme: () =>
				set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
		}),
		{
			name: THEME_STORAGE_KEY,
			partialize: ({ theme }) => ({ theme }),
			storage: {
				getItem: (name) => ({
					state: { theme: readStoredTheme(name, DEFAULT_THEME) },
					version: 0,
				}),
				setItem: (name, value) => {
					try {
						localStorage.setItem(name, JSON.stringify(value))
					} catch {
						// Переключение темы работает и при недоступном хранилище.
					}
				},
				removeItem: (name) => {
					try {
						localStorage.removeItem(name)
					} catch {
						// Хранилище может быть заблокировано настройками браузера.
					}
				},
			},
		},
	),
)

useThemeStore.subscribe(({ theme }) => applyTheme(theme))
