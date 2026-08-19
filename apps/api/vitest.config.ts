import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    testTimeout: 15000,
    hookTimeout: 60000, // Give setup hooks more time for DB operations
    teardownTimeout: 15000,
    fileParallelism: false,
    maxWorkers: 1,
  },
})
