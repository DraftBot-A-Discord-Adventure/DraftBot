import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		// coverage settings
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov'],
			reportsDirectory: './coverage'
		},
		environment: 'node',
		globals: true,
		include: ['**/*.{test,spec}.{js,ts}'],
		reporters: [
			'default',
			['junit', { outputFile: 'test-results.xml' }]
		]
	}
})