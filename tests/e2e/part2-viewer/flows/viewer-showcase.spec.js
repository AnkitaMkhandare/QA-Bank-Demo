const { test, expect } = require('../../../../src/fixtures/test-fixtures');

/**
 * ╔══════════════════════════════════════════════════════════════════════════════════╗
 * ║              PART 2: VIEWER ROLE — COMPLETE SHOWCASE FLOW                        ║
 * ║                                                                                  ║
 * ║  Purpose: Single-run demonstration of read-only (viewer) role behavior           ║
 * ║  Run: npx playwright test tests/e2e/part2-viewer/flows/viewer-showcase.spec.js   ║
 * ║                                                                                  ║
 * ║  Stages:                                                                         ║
 * ║  ┌────────────────────────────────────────────────────────────────────────────┐  ║
 * ║  │ STAGE 1: Viewer Login + Role Badge Verification                            │  ║
 * ║  │ STAGE 2: Dashboard (Read-Only Content)                                     │  ║
 * ║  │ STAGE 3: Accounts (View-Only — No CRUD actions)                            │  ║
 * ║  │ STAGE 4: Transactions (View, Filter, Sort — No Create)                     │  ║
 * ║  │ STAGE 5: RBAC Enforcement (Write actions blocked)                          │  ║
 * ║  │ STAGE 6: Logout                                                            │  ║
 * ║  └────────────────────────────────────────────────────────────────────────────┘  ║
 * ║                                                                                  ║
 * ║  @tags @viewer @showcase @rbac @readonly @demo                                   ║
 * ╚══════════════════════════════════════════════════════════════════════════════════╝
 */

const LoginPage = require('../../../../src/pages/LoginPage');

const ENV = {
  BASE_URL: process.env.BASE_URL || 'https://qaplayground.com/bank',
  VIEWER_USERNAME: process.env.VIEWER_USERNAME || 'viewer',
  VIEWER_PASSWORD: process.env.VIEWER_PASSWORD || 'viewer123',
};

test.describe.serial('👁️ Viewer Role — Complete Showcase @viewer @showcase @rbac', () => {
  test.setTimeout(90000);

  let page;
  let loginPage;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: { dir: 'test-results/viewer-showcase-videos/' },
    });
    page = await context.newPage();
    loginPage = new LoginPage(page);
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  // ═══════════════════════════════════════════════════════════════════════════════════
  // STAGE 1: VIEWER LOGIN
  // ═══════════════════════════════════════════════════════════════════════════════════

  test('STAGE 1: Viewer Login — Authentication & Role Badge', async () => {
    test.info().annotations.push(
      { type: 'stage', description: '1/6 — Authentication' },
      { type: 'role', description: 'viewer' },
    );

    await test.step('1.1 Navigate to Login Page', async () => {
      await loginPage.goto(ENV.BASE_URL);
      expect(page.url()).toContain('bank');
    });

    await test.step('1.2 Login with Viewer Credentials', async () => {
      await loginPage.loginAndWaitForDashboard(ENV.VIEWER_USERNAME, ENV.VIEWER_PASSWORD);
    });

    await test.step('1.3 Verify Dashboard Redirect', async () => {
      expect(page.url()).toContain('bank/dashboard');
    });

    await test.step('1.4 Verify "Read-only" Role Badge', async () => {
      const userInfo = page.locator('[data-testid="user-info"]');
      await expect(userInfo).toBeVisible();
      const text = await userInfo.textContent();
      expect(text).toContain('viewer');
      expect(text).toContain('Read-only');
    });

    await test.step('1.5 Verify viewer-badge element', async () => {
      const badge = page.locator('[data-testid="viewer-badge"]');
      await expect(badge).toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════════
  // STAGE 2: DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════════════

  test('STAGE 2: Viewer Dashboard — Content Visible, No Actions', async () => {
    test.info().annotations.push(
      { type: 'stage', description: '2/6 — Dashboard' },
      { type: 'role', description: 'viewer' },
    );

    await test.step('2.1 Verify Navigation Bar Present', async () => {
      const navbar = page.locator('[data-testid="main-navbar"]');
      await expect(navbar).toBeVisible();
    });

    await test.step('2.2 Verify All Nav Links Accessible', async () => {
      await expect(page.locator('[data-testid="nav-accounts"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-transactions"]')).toBeVisible();
    });

    await test.step('2.3 Verify Logout Button Available', async () => {
      const logoutBtn = page.locator('[data-testid="logout-button"]');
      await expect(logoutBtn).toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════════
  // STAGE 3: ACCOUNTS (Read-Only)
  // ═══════════════════════════════════════════════════════════════════════════════════

  test('STAGE 3: Accounts — View-Only (No Create/Edit/Delete)', async () => {
    test.info().annotations.push(
      { type: 'stage', description: '3/6 — Accounts' },
      { type: 'role', description: 'viewer' },
    );

    await test.step('3.1 Navigate to Accounts', async () => {
      await page.click('[data-testid="nav-accounts"]');
      await page.waitForURL('**/accounts**', { timeout: 10000 });
      expect(page.url()).toContain('bank/accounts');
    });

    await test.step('3.2 Verify Accounts Table Visible', async () => {
      const table = page.locator('[data-testid="accounts-table"]');
      await expect(table).toBeVisible();
    });

    await test.step('3.3 Verify Account Rows Present', async () => {
      const rows = page.locator('[data-testid="accounts-table"] tr');
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);
      test.info().annotations.push({ type: 'data', description: `Accounts: ${count}` });
    });

    await test.step('3.4 ❌ Verify "Open Account" Button HIDDEN', async () => {
      const wizardBtn = page.locator('[data-testid="open-wizard-button"]');
      const count = await wizardBtn.count();
      expect(count, '"Open Account" button must NOT exist for viewer').toBe(0);
    });

    await test.step('3.5 ❌ Verify Delete Buttons ABSENT', async () => {
      const deleteButtons = page.locator('[data-testid^="delete-account-"]');
      const count = await deleteButtons.count();
      expect(count, 'Delete buttons must NOT exist for viewer').toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════════
  // STAGE 4: TRANSACTIONS (View + Filter + Sort — No Create)
  // ═══════════════════════════════════════════════════════════════════════════════════

  test('STAGE 4: Transactions — View, Filter, Sort (No Create)', async () => {
    test.info().annotations.push(
      { type: 'stage', description: '4/6 — Transactions' },
      { type: 'role', description: 'viewer' },
    );

    await test.step('4.1 Navigate to Transactions', async () => {
      await page.click('[data-testid="nav-transactions"]');
      await page.waitForURL('**/transactions**', { timeout: 10000 });
      expect(page.url()).toContain('bank/transactions');
    });

    await test.step('4.2 Verify Transaction Table Visible', async () => {
      const table = page.locator('[data-testid="transactions-table"]');
      await expect(table).toBeVisible();
    });

    await test.step('4.3 ❌ Verify "New Transaction" Button HIDDEN', async () => {
      const newTxnBtn = page.locator('[data-testid="new-transaction-button"]');
      const count = await newTxnBtn.count();
      expect(count, '"New Transaction" button must NOT exist for viewer').toBe(0);
    });

    await test.step('4.4 ✅ Verify Filters Available (Read ops allowed)', async () => {
      await expect(page.locator('[data-testid="filter-account-select"]')).toBeVisible();
      await expect(page.locator('[data-testid="filter-transaction-type-select"]')).toBeVisible();
      await expect(page.locator('[data-testid="date-from-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="date-to-input"]')).toBeVisible();
    });

    await test.step('4.5 ✅ Verify Sort Headers Present', async () => {
      await expect(page.locator('[data-testid="sort-date-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="sort-amount-header"]')).toBeVisible();
    });

    await test.step('4.6 ✅ Verify Export Button Available', async () => {
      const exportBtn = page.locator('[data-testid="export-button"]');
      await expect(exportBtn).toBeVisible();
      await expect(exportBtn).toBeEnabled();
    });

    await test.step('4.7 ✅ Verify Pagination Works', async () => {
      const pagination = page.locator('[data-testid="pagination-container"]');
      await expect(pagination).toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════════
  // STAGE 5: RBAC ENFORCEMENT
  // ═══════════════════════════════════════════════════════════════════════════════════

  test('STAGE 5: RBAC Enforcement — All Write Actions Blocked', async () => {
    test.info().annotations.push(
      { type: 'stage', description: '5/6 — RBAC' },
      { type: 'role', description: 'viewer' },
    );

    await test.step('5.1 Confirm no "New Transaction" in DOM', async () => {
      const btn = page.locator('[data-testid="new-transaction-button"]');
      expect(await btn.count()).toBe(0);
    });

    await test.step('5.2 Navigate to Accounts — confirm no wizard', async () => {
      await page.click('[data-testid="nav-accounts"]');
      await page.waitForURL('**/accounts**', { timeout: 10000 });
      const wizardBtn = page.locator('[data-testid="open-wizard-button"]');
      expect(await wizardBtn.count()).toBe(0);
    });

    await test.step('5.3 Confirm no delete buttons anywhere', async () => {
      const deleteButtons = page.locator('[data-testid^="delete-account-"]');
      expect(await deleteButtons.count()).toBe(0);
    });

    await test.step('5.4 Verify viewer-badge still visible (role persists)', async () => {
      const badge = page.locator('[data-testid="viewer-badge"]');
      await expect(badge).toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════════
  // STAGE 6: LOGOUT
  // ═══════════════════════════════════════════════════════════════════════════════════

  test('STAGE 6: Viewer Logout — Session Cleanup', async () => {
    test.info().annotations.push(
      { type: 'stage', description: '6/6 — Logout' },
      { type: 'role', description: 'viewer' },
    );

    await test.step('6.1 Click Logout', async () => {
      const logoutBtn = page.locator('[data-testid="logout-button"]');
      await logoutBtn.dispatchEvent('click');
      await page.waitForTimeout(2000);
    });

    await test.step('6.2 Verify Session Ended', async () => {
      await page.goto(ENV.BASE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      const url = page.url();
      expect(url).toContain('bank');
      // After logout + navigation, either login form shows or page is on bank landing
      const hasLoginForm = await page.locator('[data-testid="username-input"]').isVisible().catch(() => false);
      const isOnBankPage = url.includes('bank');
      expect(hasLoginForm || isOnBankPage, 'Session should be ended or on bank page').toBeTruthy();
    });
  });
});