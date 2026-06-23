const playwright = require('@playwright/test');
const base = playwright.test;
const expect = playwright.expect;
const LoginPage = require('../pages/LoginPage');
const DashboardPage = require('../pages/DashboardPage');
const AccountsPage = require('../pages/AccountsPage');
const TransactionsPage = require('../pages/TransactionsPage');
const NavigationBar = require('../components/NavigationBar');

/**
 * Custom Playwright Test Fixtures
 * 
 * Extends the base Playwright test with pre-configured page objects
 * injected via dependency injection pattern. This eliminates boilerplate
 * in test files and ensures consistent page object instantiation.
 * 
 * Usage in tests:
 *   const { test } = require('../src/fixtures/test-fixtures');
 *   test('my test', async ({ loginPage, dashboardPage }) => { ... });
 */

// ─── Environment Configuration ───────────────────────────────────────────────────

const ENV = {
  BASE_URL: process.env.BASE_URL || 'https://qaplayground.com/bank',
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
  VIEWER_USERNAME: process.env.VIEWER_USERNAME || 'viewer',
  VIEWER_PASSWORD: process.env.VIEWER_PASSWORD || 'viewer123',
};

// ─── Custom Test Fixtures ────────────────────────────────────────────────────────

const test = base.extend({
  /**
   * Login Page Object - available in all tests
   */
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  /**
   * Dashboard Page Object - available in all tests
   */
  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  /**
   * Accounts Page Object - available in all tests
   */
  accountsPage: async ({ page }, use) => {
    const accountsPage = new AccountsPage(page);
    await use(accountsPage);
  },

  /**
   * Transactions Page Object - available in all tests
   */
  transactionsPage: async ({ page }, use) => {
    const transactionsPage = new TransactionsPage(page);
    await use(transactionsPage);
  },

  /**
   * Navigation Bar Component - available in all tests
   */
  navBar: async ({ page }, use) => {
    const navBar = new NavigationBar(page);
    await use(navBar);
  },

  /**
   * Pre-authenticated page (admin) - logs in before test
   * Use this fixture when you need a test to start from the dashboard
   */
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(ENV.BASE_URL);
    await loginPage.loginAndWaitForDashboard(ENV.ADMIN_USERNAME, ENV.ADMIN_PASSWORD);
    await use(page);
  },

  /**
   * Pre-authenticated admin session with all page objects
   * Provides a convenient bundle for tests that need auth + page objects
   */
  adminSession: async ({ page }, use) => {
    // Login as admin
    const loginPage = new LoginPage(page);
    await loginPage.goto(ENV.BASE_URL);
    await loginPage.loginAndWaitForDashboard(ENV.ADMIN_USERNAME, ENV.ADMIN_PASSWORD);

    // Provide all page objects in a single fixture
    const session = {
      page,
      dashboard: new DashboardPage(page),
      accounts: new AccountsPage(page),
      transactions: new TransactionsPage(page),
      navBar: new NavigationBar(page),
    };

    await use(session);
  },

  /**
   * Pre-authenticated viewer session (read-only access)
   */
  viewerSession: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(ENV.BASE_URL);
    await loginPage.loginAndWaitForDashboard(ENV.VIEWER_USERNAME, ENV.VIEWER_PASSWORD);

    const session = {
      page,
      dashboard: new DashboardPage(page),
      accounts: new AccountsPage(page),
      transactions: new TransactionsPage(page),
      navBar: new NavigationBar(page),
    };

    await use(session);
  },

  /**
   * Base URL fixture - accessible in all tests
   */
  baseUrl: async ({}, use) => {
    await use(ENV.BASE_URL);
  },

  /**
   * Test credentials fixture
   */
  credentials: async ({}, use) => {
    await use({
      admin: { username: ENV.ADMIN_USERNAME, password: ENV.ADMIN_PASSWORD },
      viewer: { username: ENV.VIEWER_USERNAME, password: ENV.VIEWER_PASSWORD },
    });
  },
});

module.exports = { test, expect, ENV };