export type Theme = 'light' | 'dark'

type ThemeStoreState = {
	theme: Theme
}

type ThemeStoreActions = {
	setTheme: (theme: Theme) => void
	toggleTheme: () => void
}

export type ThemeStore = ThemeStoreState & ThemeStoreActions
