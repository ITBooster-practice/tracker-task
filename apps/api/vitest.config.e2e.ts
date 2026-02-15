import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import swc from 'unplugin-swc'

export default defineConfig({
	plugins: [tsconfigPaths(), swc.vite()],
	test: {
		root: './test',
		include: ['**/*.e2e-spec.ts'],
		environment: 'node',
		globals: true,
		setupFiles: ['../vitest.setup.ts'],
	},
})
