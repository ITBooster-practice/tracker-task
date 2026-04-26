import { defineConfig } from 'vitest/config'

export const baseConfig = defineConfig({
	test: {
		coverage: {
			enabled: true,
			provider: 'v8',
			reportsDirectory: 'coverage',
			thresholds: {
				statements: 80,
				branches: 80,
				functions: 80,
				lines: 80,
			},
		},
		environment: 'jsdom',
	},
})
