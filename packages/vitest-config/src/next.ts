import react from '@vitejs/plugin-react'
import { defineConfig, mergeConfig } from 'vitest/config'

import { baseConfig } from './base'

export const nextConfig = mergeConfig(
	baseConfig,
	defineConfig({
		plugins: [react()],
		test: {
			include: ['**/*.{test,spec}.{js,jsx,ts,tsx}'],
			environment: 'jsdom',
		},
	}),
)

export default nextConfig
