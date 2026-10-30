import {
	applyTheme,
	DEFAULT_THEME,
	readStoredTheme,
	THEME_STORAGE_KEY,
} from './lib/theme'

export { DEFAULT_THEME }

export const themeBootstrapScript = `(${applyTheme.toString()})((${readStoredTheme.toString()})(${JSON.stringify(THEME_STORAGE_KEY)},${JSON.stringify(DEFAULT_THEME)}));`
