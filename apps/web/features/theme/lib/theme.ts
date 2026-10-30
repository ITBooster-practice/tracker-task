import type { Theme } from '../types/theme'

export const DEFAULT_THEME: Theme = 'dark'
export const THEME_STORAGE_KEY = 'theme'

// Функции должны быть автономными: скрипт в head выполняет их сериализованный код.
export function readStoredTheme(storageKey: string, fallback: Theme): Theme {
	try {
		const persisted = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
		const theme = persisted?.state?.theme

		if (
			(persisted?.version === undefined || persisted.version === 0) &&
			(theme === 'light' || theme === 'dark')
		) {
			return theme
		}
	} catch {
		// Хранилище может быть заблокировано или содержать некорректный JSON.
	}

	return fallback
}

export function applyTheme(theme: Theme) {
	if (typeof document === 'undefined') return

	const root = document.documentElement
	root.classList.toggle('dark', theme === 'dark')
	root.style.colorScheme = theme
}
