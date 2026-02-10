import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PORT ?? '3000';
const HOST = process.env.HOST ?? '127.0.0.1';
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://${HOST}:${PORT}`;
const isCI = Boolean(process.env.CI);
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEB_SERVER === '1';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  fullyParallel: isCI,
  workers: isCI ? undefined : 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 393, height: 851 },
      },
    },
  ],
  webServer: skipWebServer
    ? undefined
    : {
        command: 'npm run dev',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180 * 1000,
      },
});
