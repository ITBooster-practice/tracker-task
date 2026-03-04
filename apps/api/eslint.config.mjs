import { nestJsConfig } from '@repo/eslint-config/nest-js'

/** @type {import("eslint").Linter.Config} */
export default [
	...nestJsConfig,
	{
		languageOptions: {
			parserOptions: {
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		ignores: ['.prettierrc.mjs', 'eslint.config.mjs'],
	},
]
