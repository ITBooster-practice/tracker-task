import { defineConfig } from 'vitest/config'

export const baseConfig = defineConfig({
	test: {
		coverage: {
			enabled: true,
			provider: 'v8',
			reportsDirectory: 'coverage',
		},
		environment: 'jsdom',
	},
})
