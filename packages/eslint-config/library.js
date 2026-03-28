import globals from 'globals'

import { config as baseConfig } from './base.js'

/**
 * Пользовательская конфигурация ESLint для библиотек, использующих React.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const libraryConfig = [
	...baseConfig,
	{
		languageOptions: {
			globals: {
				...globals.node,
				React: true,
				JSX: true,
			},
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
			},
		},
		settings: {
			'import/resolver': {
				typescript: {
					project: './tsconfig.json',
				},
			},
		},
	},
]

export default libraryConfig
