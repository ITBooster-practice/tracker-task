import path from 'path'
import { defineConfig, mergeConfig } from 'vitest/config'

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
			include: ['test/**/*.spec.ts', 'test/**/*.spec.tsx'],
			coverage: {
				include: [
					'app/**',
					'entities/**',
					'features/**',
					'views/**',
					'widgets/**',
					'shared/**',
				],
				exclude: [
					'**/*.d.ts',
					'**/index.ts',
					'**/types.ts',
					'**/types/**',
					'**/*.config.*',
				],
			},
		},
	}),
)
