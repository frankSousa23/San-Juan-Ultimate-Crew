import { defineConfig, devices } from '@playwright/test'

const enableAuthProjects = process.env.PW_AUTH_PROJECTS === '1'

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  globalSetup: './tests/global-setup.ts',
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    headless: true,
    trace: process.env.CI ? 'on-first-retry' : 'off',
    screenshot: process.env.CI ? 'only-on-failure' : 'off',
    video: process.env.CI ? 'retain-on-failure' : 'off',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Enable these only when PW_AUTH_PROJECTS=1 to preserve default behavior
    ...(
      enableAuthProjects
        ? [
            {
              name: 'admin (storageState)',
              testDir: './tests',
              use: {
                ...devices['Desktop Chrome'],
                storageState: 'tests/.auth/admin.json',
              },
            },
            {
              name: 'guest (storageState)',
              testDir: './tests',
              use: {
                ...devices['Desktop Chrome'],
                storageState: 'tests/.auth/guest.json',
              },
            },
          ]
        : []
    ),
  ],
  webServer: [
    {
      command: process.platform === 'win32'
        ? 'cross-env AUTH_REQUIRED=true npm --prefix ..\\api run start'
        : 'AUTH_REQUIRED=true npm --prefix ../api run start',
      port: 4000,
      reuseExistingServer: true,
      timeout: 120000,
    },
    {
      command: 'npm run dev -- --port 5173 --strictPort',
      port: 5173,
      reuseExistingServer: true,
      timeout: 60000,
    },
  ],
})
