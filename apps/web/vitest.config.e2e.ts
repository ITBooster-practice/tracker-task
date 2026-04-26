import path from 'path'
import { configDefaults, defineConfig, mergeConfig } from 'vitest/config'

import { nextConfig } from '@repo/vitest-config/next'

export default mergeConfig(
	nextConfig,
	defineConfig({
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './'),
			},
		},
		test: {
			root: '.',
			include: ['test/e2e/**/*.e2e.spec.ts', 'test/e2e/**/*.e2e.spec.tsx'],
			exclude: [...configDefaults.exclude, 'test/unit/**'],
			coverage: {
				enabled: false,
			},
		},
	}),
)
