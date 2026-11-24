import { defineConfig, devices } from '@playwright/test';

const chromium = { ...devices['Desktop Chrome'] };

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report', title: 'Relatório funcional do desafio NTConsult' }],
    ['./scripts/rotular-relatorio.js'],
    ...(process.env.CI ? [['github']] : []),
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
    ...chromium,
  },
  projects: [
    {
      name: 'Teste API',
      testMatch: /api\/.*\.spec\.js/,
    },
    {
      name: 'Teste UI',
      testMatch: /ui\/.*\.spec\.js/,
      fullyParallel: false,
    },
    {
      name: 'Teste Performance',
      testMatch: /fluxo\/.*\.spec\.js/,
    },
  ],
});
