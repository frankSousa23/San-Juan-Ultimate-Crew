import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 30000, // Give setup hooks more time
    teardownTimeout: 10000,
  },
})
