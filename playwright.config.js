const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright Configuration
 * 
 * Professional test automation framework configuration with:
 * - Multi-browser support (Chromium, Firefox, WebKit)
 * - Environment-based configuration
 * - Parallel execution
 * - Comprehensive reporting
 * - Screenshot & video on failure
 * - Retry logic for stability
 * 
 * @see https://playwright.dev/docs/test-configuration
 */

// Load environment-specific settings
const BASE_URL = process.env.BASE_URL || 'https://qaplayground.com/bank';
const CI = !!process.env.CI;

module.exports = defineConfig({
  // ─── Test Discovery ──────────────────────────────────────────────────────────────
  testDir: './tests/e2e',
  testMatch: '**/*.spec.js',

  // ─── Execution Settings ──────────────────────────────────────────────────────────
  timeout: 30000,
  expect: {
    timeout: 10000,
  },

  // ─── Parallel Execution ──────────────────────────────────────────────────────────
  fullyParallel: true,
  workers: CI ? 2 : 4,

  // ─── Retry Strategy ──────────────────────────────────────────────────────────────
  retries: CI ? 2 : 1,

  // ─── Reporting ───────────────────────────────────────────────────────────────────
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'reports/html-report' }],
    ['json', { outputFile: 'reports/test-results.json' }],
    ['junit', { outputFile: 'reports/junit-results.xml' }],
  ],

  // ─── Output Directories ──────────────────────────────────────────────────────────
  outputDir: 'test-results/artifacts',

  // ─── Global Settings ─────────────────────────────────────────────────────────────
  use: {
    // Base URL for navigation
    baseURL: BASE_URL,

    // Browser settings
    headless: CI,
    viewport: { width: 1920, height: 1080 },

    // SlowMo: Add delay between actions for visual tracking in headed mode
    // Set to 0 in CI for speed, 800ms locally for demo visibility
    launchOptions: {
      slowMo: CI ? 0 : 800,
    },

    // Artifacts
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    // Timeouts
    actionTimeout: 10000,
    navigationTimeout: 15000,

    // Other
    ignoreHTTPSErrors: true,
    bypassCSP: true,
  },

  // ─── Browser Projects ────────────────────────────────────────────────────────────
  projects: [
    // ── Primary: Desktop Chrome ──────────────────────────────────────────────────
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
      },
    },

    // ── Cross-browser: Firefox ───────────────────────────────────────────────────
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },

    // ── Cross-browser: WebKit (Safari) ───────────────────────────────────────────
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },

    // ── Mobile: iPhone 14 ────────────────────────────────────────────────────────
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 7'],
      },
    },

    // ── Mobile: Safari ───────────────────────────────────────────────────────────
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 14'],
      },
    },

    // ── Cross-browser: Microsoft Edge ─────────────────────────────────────────────
    {
      name: 'edge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
      },
    },
  ],
});
