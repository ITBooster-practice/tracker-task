import { defineConfig, mergeConfig } from 'vitest/config'
import { nestConfig } from '@repo/vitest-config'
import tsconfigPaths from 'vite-tsconfig-paths'
import swc from 'unplugin-swc'

export default mergeConfig(
	nestConfig,
	defineConfig({
		plugins: [tsconfigPaths(), swc.vite()],
		test: {
			root: '.',
			include: ['src/**/*.spec.ts', 'test/unit/**/*.spec.ts'],
			setupFiles: ['./vitest.setup.ts'],
			coverage: {
				provider: 'v8',
				exclude: [
					'**/config/**',
					'**/decorators/**',
					'swagger.util.ts',
					'**/constants/**',
					'**/guards/auth.guard.ts',
					'**/mail/templates/**',
				],
			},
		},
	}),
)
