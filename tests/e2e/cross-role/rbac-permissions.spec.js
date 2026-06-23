const { test, expect } = require('../../../src/fixtures/test-fixtures');

/**
 * CROSS-ROLE: RBAC Permission Comparison Tests
 * 
 * Validates that Admin and Viewer roles have correct access controls:
 * - Admin: Full CRUD (Create, Read, Update, Delete)
 * - Viewer: Read-Only (No Create, No Update, No Delete)
 * 
 * This test demonstrates role-based access control (RBAC) validation
 * — a critical test category for any enterprise banking application.
 * 
 * @tags @rbac @cross-role @security @permissions
 */

const LoginPage = require('../../../src/pages/LoginPage');

const ENV = {
  BASE_URL: process.env.BASE_URL || 'https://qaplayground.com/bank',
};

const ROLES = {
  admin: { username: 'admin', password: 'admin123' },
  viewer: { username: 'viewer', password: 'viewer123' },
};

test.describe('🔒 RBAC Permission Matrix — Admin vs Viewer @rbac @cross-role', () => {

  test('TC-RBAC-01: Admin has "Open Account" button — Viewer does NOT', async ({ browser }) => {
    test.info().annotations.push(
      { type: 'category', description: 'RBAC — Create Account' },
      { type: 'severity', description: 'critical' },
    );

    // --- Admin Session ---
    await test.step('Admin: Login and check "Open Account" button', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      const login = new LoginPage(page);
      await login.goto(ENV.BASE_URL);
      await login.loginAndWaitForDashboard(ROLES.admin.username, ROLES.admin.password);
      await page.click('[data-testid="nav-accounts"]');
      await page.waitForURL('**/accounts**', { timeout: 10000 });

      const wizardBtn = page.locator('[data-testid="open-wizard-button"]');
      const adminHasButton = await wizardBtn.isVisible().catch(() => false);
      expect(adminHasButton, 'Admin SHOULD see "Open Account" button').toBeTruthy();
      await context.close();
    });

    // --- Viewer Session ---
    await test.step('Viewer: Login and check "Open Account" button is HIDDEN', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      const login = new LoginPage(page);
      await login.goto(ENV.BASE_URL);
      await login.loginAndWaitForDashboard(ROLES.viewer.username, ROLES.viewer.password);
      await page.click('[data-testid="nav-accounts"]');
      await page.waitForURL('**/accounts**', { timeout: 10000 });

      const wizardBtn = page.locator('[data-testid="open-wizard-button"]');
      const viewerCount = await wizardBtn.count();
      expect(viewerCount, 'Viewer should NOT see "Open Account" button').toBe(0);
      await context.close();
    });
  });

  test('TC-RBAC-02: Admin has "New Transaction" button — Viewer does NOT', async ({ browser }) => {
    test.info().annotations.push(
      { type: 'category', description: 'RBAC — Create Transaction' },
      { type: 'severity', description: 'critical' },
    );

    // --- Admin Session ---
    await test.step('Admin: "New Transaction" button visible', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      const login = new LoginPage(page);
      await login.goto(ENV.BASE_URL);
      await login.loginAndWaitForDashboard(ROLES.admin.username, ROLES.admin.password);
      await page.click('[data-testid="nav-transactions"]');
      await page.waitForURL('**/transactions**', { timeout: 10000 });

      const newTxnBtn = page.locator('[data-testid="new-transaction-button"]');
      const adminHasButton = await newTxnBtn.isVisible().catch(() => false);
      expect(adminHasButton, 'Admin SHOULD see "New Transaction" button').toBeTruthy();
      await context.close();
    });

    // --- Viewer Session ---
    await test.step('Viewer: "New Transaction" button HIDDEN', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      const login = new LoginPage(page);
      await login.goto(ENV.BASE_URL);
      await login.loginAndWaitForDashboard(ROLES.viewer.username, ROLES.viewer.password);
      await page.click('[data-testid="nav-transactions"]');
      await page.waitForURL('**/transactions**', { timeout: 10000 });

      const newTxnBtn = page.locator('[data-testid="new-transaction-button"]');
      const viewerCount = await newTxnBtn.count();
      expect(viewerCount, 'Viewer should NOT see "New Transaction" button').toBe(0);
      await context.close();
    });
  });

  test('TC-RBAC-03: Admin has Delete buttons — Viewer does NOT', async ({ browser }) => {
    test.info().annotations.push(
      { type: 'category', description: 'RBAC — Delete Account' },
      { type: 'severity', description: 'critical' },
    );

    // --- Admin Session ---
    await test.step('Admin: Delete buttons present', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      const login = new LoginPage(page);
      await login.goto(ENV.BASE_URL);
      await login.loginAndWaitForDashboard(ROLES.admin.username, ROLES.admin.password);
      await page.click('[data-testid="nav-accounts"]');
      await page.waitForURL('**/accounts**', { timeout: 10000 });

      const deleteButtons = page.locator('[data-testid^="delete-account-"]');
      const adminCount = await deleteButtons.count();
      expect(adminCount, 'Admin SHOULD have delete buttons').toBeGreaterThan(0);
      await context.close();
    });

    // --- Viewer Session ---
    await test.step('Viewer: No delete buttons', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      const login = new LoginPage(page);
      await login.goto(ENV.BASE_URL);
      await login.loginAndWaitForDashboard(ROLES.viewer.username, ROLES.viewer.password);
      await page.click('[data-testid="nav-accounts"]');
      await page.waitForURL('**/accounts**', { timeout: 10000 });

      const deleteButtons = page.locator('[data-testid^="delete-account-"]');
      const viewerCount = await deleteButtons.count();
      expect(viewerCount, 'Viewer should NOT have delete buttons').toBe(0);
      await context.close();
    });
  });

  test('TC-RBAC-04: Both roles can view transaction history', async ({ browser }) => {
    test.info().annotations.push(
      { type: 'category', description: 'RBAC — Read Access' },
      { type: 'severity', description: 'high' },
    );

    for (const [role, creds] of Object.entries(ROLES)) {
      await test.step(`${role}: Can view transactions table`, async () => {
        const context = await browser.newContext();
        const page = await context.newPage();
        const login = new LoginPage(page);
        await login.goto(ENV.BASE_URL);
        await login.loginAndWaitForDashboard(creds.username, creds.password);
        await page.click('[data-testid="nav-transactions"]');
        await page.waitForURL('**/transactions**', { timeout: 10000 });

        const table = page.locator('[data-testid="transactions-table"]');
        await expect(table).toBeVisible();

        const rows = page.locator('[data-testid="transaction-row"]');
        const count = await rows.count();
        expect(count, `${role} should see transaction rows`).toBeGreaterThan(0);
        await context.close();
      });
    }
  });

  test('TC-RBAC-05: Role badge differs between Admin and Viewer', async ({ browser }) => {
    test.info().annotations.push(
      { type: 'category', description: 'RBAC — Role Identity' },
      { type: 'severity', description: 'medium' },
    );

    await test.step('Admin: No viewer-badge shown', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      const login = new LoginPage(page);
      await login.goto(ENV.BASE_URL);
      await login.loginAndWaitForDashboard(ROLES.admin.username, ROLES.admin.password);

      const viewerBadge = page.locator('[data-testid="viewer-badge"]');
      const hasViewerBadge = await viewerBadge.isVisible().catch(() => false);
      expect(hasViewerBadge, 'Admin should NOT have viewer badge').toBeFalsy();
      await context.close();
    });

    await test.step('Viewer: viewer-badge IS shown', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      const login = new LoginPage(page);
      await login.goto(ENV.BASE_URL);
      await login.loginAndWaitForDashboard(ROLES.viewer.username, ROLES.viewer.password);

      const viewerBadge = page.locator('[data-testid="viewer-badge"]');
      await expect(viewerBadge).toBeVisible();
      await context.close();
    });
  });
});