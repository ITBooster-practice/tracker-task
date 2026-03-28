import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

import { config as baseConfig } from './base.js'

/**
 * Пользовательская конфигурация ESLint для библиотек, использующих React.
 *
 * @type {import("eslint").Linter.Config[]} */
export const config = [
	...baseConfig,
	pluginReact.configs.flat.recommended,
	{
		languageOptions: {
			...pluginReact.configs.flat.recommended.languageOptions,
			globals: {
				...globals.serviceworker,
				...globals.browser,
			},
		},
	},
	{
		plugins: {
			'react-hooks': pluginReactHooks,
		},
		settings: { react: { version: 'detect' } },
		rules: {
			...pluginReactHooks.configs.recommended.rules,
			// React scope больше не требуется с новым JSX трансформом.
			'react/react-in-jsx-scope': 'off',
		},
	},
]
