import globals from 'globals'

import { config as baseConfig } from './base.js'

/**
 * Пользовательская конфигурация ESLint для проектов, использующих Nest.js.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const nestJsConfig = [
	...baseConfig,
	{
		languageOptions: {
			globals: {
				...globals.node,
				...globals.jest,
			},
			sourceType: 'commonjs',
			parserOptions: {
				projectService: true,
				tsconfigRootDir: process.cwd(),
			},
		},
	},
	{
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-floating-promises': 'warn',
			'@typescript-eslint/no-unsafe-argument': 'warn',
		},
	},
]
