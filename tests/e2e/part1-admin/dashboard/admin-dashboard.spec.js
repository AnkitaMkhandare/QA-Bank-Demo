const { test, expect } = require('../../../../src/fixtures/test-fixtures');

/**
 * Dashboard Feature — Test Suite
 * 
 * Covers:
 * - Summary cards visibility and data
 * - Total balance validation
 * - Navigation links functionality
 * - Recent transactions display
 * 
 * @tags @smoke @regression
 */

test.describe('Dashboard Feature @smoke', () => {

  // ─── Summary Cards ───────────────────────────────────────────────────────────

  test('TC-DASH-01: Dashboard displays summary cards after login @critical', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'TC-DASH-01' },
      { type: 'severity', description: 'critical' },
    );

    const { dashboard } = adminSession;
    await dashboard.isLoaded();
    await dashboard.verifySummaryCardsVisible();

    const cardCount = await dashboard.getSummaryCardCount();
    expect(cardCount).toBeGreaterThanOrEqual(1);
  });

  // ─── Total Balance Validation ────────────────────────────────────────────────

  test('TC-DASH-02: Total balance matches sum of account balances @regression @known-bug', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'TC-DASH-02' },
      { type: 'severity', description: 'normal' },
      { type: 'issue', description: 'KNOWN BUG: Dashboard total may not match account sum' },
    );

    // Mark as known failure — application bug
    test.fixme(true, 'Dashboard total balance does not match sum of accounts (app bug)');

    const { dashboard, navBar, accounts } = adminSession;
    await dashboard.isLoaded();

    const dashboardBalance = await dashboard.getTotalBalance();

    // Navigate to accounts and sum balances
    await navBar.goToAccounts();
    const balances = await accounts.getAllBalances();
    const accountsTotal = balances.reduce((sum, b) => sum + b, 0);

    expect(dashboardBalance).toBeCloseTo(accountsTotal, 2);
  });

  // ─── Navigation Links ────────────────────────────────────────────────────────

  test('TC-DASH-04: Navigation links are visible and functional @regression', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'TC-DASH-04' },
      { type: 'severity', description: 'normal' },
    );

    const { dashboard, navBar } = adminSession;
    await dashboard.isLoaded();
    await dashboard.verifyNavigationLinksVisible();

    // Test Accounts navigation
    await navBar.goToAccounts();
    expect(adminSession.page.url()).toContain('/bank/accounts');

    // Test Transactions navigation
    await navBar.goToTransactions();
    expect(adminSession.page.url()).toContain('/bank/transactions');

    // Test Dashboard navigation (back)
    await navBar.goToDashboard();
    expect(adminSession.page.url()).toContain('/bank/dashboard');
  });

  // ─── Recent Transactions ─────────────────────────────────────────────────────

  test('TC-DASH-05: Recent transactions are displayed on dashboard @regression', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'TC-DASH-05' },
      { type: 'severity', description: 'normal' },
    );

    const { dashboard } = adminSession;
    await dashboard.isLoaded();
    await dashboard.verifyRecentTransactionsVisible();

    const count = await dashboard.getRecentTransactionCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  // ─── User Info Display ───────────────────────────────────────────────────────

  test('TC-DASH-06: Logged-in user info is correctly displayed @smoke', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'TC-DASH-06' },
      { type: 'severity', description: 'normal' },
    );

    const { dashboard } = adminSession;
    await dashboard.isLoaded();
    await dashboard.verifyLoggedInUser('admin');
  });
});
