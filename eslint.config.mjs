import tsParser from '@typescript-eslint/parser'

import { libraryConfig } from '@repo/eslint-config/library'

export default [
	// Глобальные игноры (только мусор)
	{
		ignores: ['dist/**', 'node_modules/**'],
	},

	// Базовый конфиг (твой шареный)
	...libraryConfig,

	// Настройки TypeScript
	{
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				projectService: true, // поддерживает tsconfig references и stories
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},

	// Переопределения правил
	{
		rules: {
			// временно отключено (много any после миграции)
			'@typescript-eslint/no-explicit-any': 'off',

			// используем в util-функциях (isFunction и т.д.)
			'@typescript-eslint/unbound-method': 'off',
		},
	},
]
