import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			reportsDirectory: './coverage'
		},
		environment: 'node',
		globals: true,
		include: ['**/*.{test,spec}.{js,ts}'],
	},
})