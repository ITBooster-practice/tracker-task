import { defineConfig, mergeConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { baseConfig } from './base'
import path from 'path'

export const nextConfig = mergeConfig(
	baseConfig,
	defineConfig({
		plugins: [react()],
		test: {
			include: ['**/*.{test,spec}.{js,jsx,ts,tsx}'],
			environment: 'jsdom',
		},
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './'),
			},
		},
	}),
)

export default nextConfig
