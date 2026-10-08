import { defineConfig, devices } from '@playwright/test';

/**
 * Tests responsive mobile (Android via chromium, iOS via webkit).
 *
 * Prérequis :
 *   npm i -D @playwright/test && npx playwright install
 *   Application accessible (dev server ou build servi) à E2E_BASE_URL.
 *
 * Variables d'environnement :
 *   E2E_BASE_URL  (défaut http://localhost:4200)
 *   E2E_EMAIL / E2E_PASSWORD  (compte de test ; jamais committés)
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/artifacts',
  reporter: [['html', { outputFolder: 'e2e/report', open: 'never' }], ['list']],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:4200',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'iPhone SE (webkit)', use: { ...devices['iPhone SE'] } },
    { name: 'iPhone 14 (webkit)', use: { ...devices['iPhone 14'] } },
    { name: 'iPad Mini (webkit)', use: { ...devices['iPad Mini'] } },
    { name: 'Pixel 7 (chromium)', use: { ...devices['Pixel 7'] } },
  ],
});
