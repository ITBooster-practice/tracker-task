import { defineConfig } from 'vitest/config'

export const baseConfig = defineConfig({
	test: {
		coverage: {
			enabled: true,
			provider: 'v8',
			reportsDirectory: 'coverage',
			thresholds: {
				statements: 50,
				branches: 50,
				functions: 50,
				lines: 50,
			},
		},
		environment: 'jsdom',
	},
})
