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
				include: ['entities/**', 'features/**', 'views/**', 'widgets/**', 'shared/**'],
				exclude: [
					'**/*.d.ts',
					'**/index.ts',
					'**/types.ts',
					'**/types/**',
					'**/*.config.*',
					'**/*.css',
					'**/styles.ts',
					'shared/api/use-example.ts',
					'shared/lib/api/client.ts',
					'shared/lib/query-client.ts',
					'shared/lib/api/public-client.ts',
					'shared/lib/api/example-service.ts',
					'test/**',
					'widgets/main-layout/ui/layout.tsx',
					'views/profile/ui/profile-list-skeleton.tsx',
					'views/profile/ui/profile-section-state.tsx',
				],
			},
		},
	}),
)
