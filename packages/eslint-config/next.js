import pluginNext from '@next/eslint-plugin-next'
import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

import { config as baseConfig } from './base.js'

/**
 * Пользовательская конфигурация ESLint для библиотек, использующих Next.js.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const nextJsConfig = [
	...baseConfig,
	{
		...pluginReact.configs.flat.recommended,
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
			'@next/next': pluginNext,
		},
		rules: {
			...pluginNext.configs.recommended.rules,
			...pluginNext.configs['core-web-vitals'].rules,
		},
	},
	{
		plugins: {
			'react-hooks': pluginReactHooks,
		},
		settings: { react: { version: 'detect' } },
		rules: {
			...pluginReactHooks.configs.recommended.rules,
			// Область действия React больше не нужна с новым преобразованием JSX.
			'react/react-in-jsx-scope': 'off',
		},
	},
]
