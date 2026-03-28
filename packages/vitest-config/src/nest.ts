import { defineConfig, mergeConfig } from 'vitest/config'

import { baseConfig } from './base'

export const nestConfig = mergeConfig(
	baseConfig,
	defineConfig({
		test: {
			root: './src',
			include: ['**/*.spec.ts'],
			coverage: {
				enabled: true,
				provider: 'v8',
				reportsDirectory: '../coverage',
				include: ['**/*.ts'],
				exclude: [
					'**/*.spec.ts',
					'**/*.d.ts',
					'**/main.ts',
					'**/*.module.ts',
					'**/*.dto.ts',
					'**/dto/**',
					'**/*.interface.ts',
					'**/interfaces/**',
					'generated/prisma/**',
					'prisma.config.ts',
					'vitest.config.*.ts',
					'prisma/**',
					'test/**',
				],
			},
			environment: 'node',
			globals: true,
		},
	}),
)
