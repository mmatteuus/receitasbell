import './tests/playwright-env';
import { defineConfig, devices } from '@playwright/test';

const DEFAULT_LOCAL_BASE_URL = 'http://127.0.0.1:4173';
const configuredBaseURL = process.env.PLAYWRIGHT_BASE_URL?.trim();
const baseURL = configuredBaseURL || DEFAULT_LOCAL_BASE_URL;
const shouldStartLocalServer = !configuredBaseURL || configuredBaseURL === DEFAULT_LOCAL_BASE_URL;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: shouldStartLocalServer
    ? {
        command: 'npm run dev -- --host 127.0.0.1 --port 4173',
        url: DEFAULT_LOCAL_BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
