const { test, expect } = require('../../../../src/fixtures/test-fixtures');

/**
 * PART 2: VIEWER ROLE — Transactions Page (Read-Only)
 * 
 * Validates that the viewer user:
 * - CAN view transaction history
 * - CANNOT create new transactions (button hidden)
 * - CAN use filters, sorting, and pagination (read operations)
 * - CAN export transaction data
 * 
 * @tags @viewer @transactions @rbac @readonly
 */

test.describe('💳 Viewer Transactions — Read-Only Access @viewer @transactions @rbac', () => {

  test.beforeEach(async ({ page }) => {
    const LoginPage = require('../../../../src/pages/LoginPage');
    const loginPage = new LoginPage(page);
    const baseUrl = process.env.BASE_URL || 'https://qaplayground.com/bank';
    await loginPage.goto(baseUrl);
    await loginPage.loginAndWaitForDashboard('viewer', 'viewer123');
    await page.click('[data-testid="nav-transactions"]');
    await page.waitForURL('**/transactions**', { timeout: 10000 });
  });

  test('TC-V-TXN-01: Viewer can view transaction history', async ({ page }) => {
    test.info().annotations.push(
      { type: 'role', description: 'viewer' },
      { type: 'severity', description: 'critical' },
      { type: 'permission', description: 'READ — allowed' },
    );

    await test.step('Verify transactions table is visible', async () => {
      const table = page.locator('[data-testid="transactions-table"]');
      await expect(table).toBeVisible();
    });

    await test.step('Verify transaction rows are present', async () => {
      const rows = page.locator('[data-testid="transaction-row"]');
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);
      test.info().annotations.push({ type: 'data', description: `Transactions visible: ${count}` });
    });

    await test.step('Verify transaction details are displayed (date, type, amount)', async () => {
      const firstRow = page.locator('[data-testid="transaction-row"]').first();
      const date = firstRow.locator('[data-testid="transaction-date"]');
      const type = firstRow.locator('[data-testid="transaction-type"]');
      const amount = firstRow.locator('[data-testid="transaction-amount"]');

      await expect(date).toBeVisible();
      await expect(type).toBeVisible();
      await expect(amount).toBeVisible();
    });
  });

  test('TC-V-TXN-02: "New Transaction" button is NOT visible for viewer', async ({ page }) => {
    test.info().annotations.push(
      { type: 'role', description: 'viewer' },
      { type: 'severity', description: 'blocker' },
      { type: 'permission', description: 'CREATE — blocked' },
    );

    await test.step('Verify "New Transaction" button is not visible', async () => {
      const newTxnBtn = page.locator('[data-testid="new-transaction-button"]');
      await expect(newTxnBtn).not.toBeVisible();
    });

    await test.step('Verify button is not in DOM', async () => {
      const count = await page.locator('[data-testid="new-transaction-button"]').count();
      expect(count).toBe(0);
    });
  });

  test('TC-V-TXN-03: Viewer can use filter controls', async ({ page }) => {
    test.info().annotations.push(
      { type: 'role', description: 'viewer' },
      { type: 'severity', description: 'high' },
      { type: 'permission', description: 'FILTER — allowed' },
    );

    await test.step('Verify account filter is available', async () => {
      const filterAccount = page.locator('[data-testid="filter-account-select"]');
      await expect(filterAccount).toBeVisible();
    });

    await test.step('Verify transaction type filter is available', async () => {
      const filterType = page.locator('[data-testid="filter-transaction-type-select"]');
      await expect(filterType).toBeVisible();
    });

    await test.step('Verify date range filters are available', async () => {
      const dateFrom = page.locator('[data-testid="date-from-input"]');
      const dateTo = page.locator('[data-testid="date-to-input"]');
      await expect(dateFrom).toBeVisible();
      await expect(dateTo).toBeVisible();
    });

    await test.step('Verify apply/reset filter buttons work', async () => {
      const applyBtn = page.locator('[data-testid="apply-filters-button"]');
      const resetBtn = page.locator('[data-testid="reset-filters-button"]');
      await expect(applyBtn).toBeVisible();
      await expect(resetBtn).toBeVisible();
    });
  });

  test('TC-V-TXN-04: Viewer can sort transactions by columns', async ({ page }) => {
    test.info().annotations.push(
      { type: 'role', description: 'viewer' },
      { type: 'severity', description: 'medium' },
      { type: 'permission', description: 'SORT — allowed' },
    );

    await test.step('Verify sort headers are clickable', async () => {
      const sortDate = page.locator('[data-testid="sort-date-header"]');
      const sortType = page.locator('[data-testid="sort-type-header"]');
      const sortAmount = page.locator('[data-testid="sort-amount-header"]');

      await expect(sortDate).toBeVisible();
      await expect(sortType).toBeVisible();
      await expect(sortAmount).toBeVisible();
    });

    await test.step('Click sort by amount — no errors', async () => {
      const sortAmount = page.locator('[data-testid="sort-amount-header"]');
      await sortAmount.click();
      await page.waitForTimeout(500);
      // Verify page didn't crash
      const table = page.locator('[data-testid="transactions-table"]');
      await expect(table).toBeVisible();
    });
  });

  test('TC-V-TXN-05: Viewer can use pagination controls', async ({ page }) => {
    test.info().annotations.push(
      { type: 'role', description: 'viewer' },
      { type: 'severity', description: 'medium' },
      { type: 'permission', description: 'PAGINATION — allowed' },
    );

    await test.step('Verify pagination container is visible', async () => {
      const pagination = page.locator('[data-testid="pagination-container"]');
      await expect(pagination).toBeVisible();
    });

    await test.step('Verify page info is displayed', async () => {
      const pageInfo = page.locator('[data-testid="pagination-page-info"]');
      await expect(pageInfo).toBeVisible();
    });

    await test.step('Verify rows-per-page selector is available', async () => {
      const rowsSelect = page.locator('[data-testid="rows-per-page-select"]');
      await expect(rowsSelect).toBeVisible();
    });
  });

  test('TC-V-TXN-06: Viewer can export transaction data', async ({ page }) => {
    test.info().annotations.push(
      { type: 'role', description: 'viewer' },
      { type: 'severity', description: 'medium' },
      { type: 'permission', description: 'EXPORT — allowed' },
    );

    await test.step('Verify export button is visible and enabled', async () => {
      const exportBtn = page.locator('[data-testid="export-button"]');
      await expect(exportBtn).toBeVisible();
      await expect(exportBtn).toBeEnabled();
    });
  });

  test('TC-V-TXN-07: Viewer can view transaction summary bar', async ({ page }) => {
    test.info().annotations.push(
      { type: 'role', description: 'viewer' },
      { type: 'severity', description: 'low' },
      { type: 'permission', description: 'READ — allowed' },
    );

    await test.step('Verify summary bar is visible', async () => {
      const summaryBar = page.locator('[data-testid="transactions-summary-bar"]');
      await expect(summaryBar).toBeVisible();
    });
  });
});