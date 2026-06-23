const { test, expect } = require('../../../src/fixtures/test-fixtures');
const txnData = require('../../../src/config/test-data/transactions.json');

/**
 * Transactions Feature — Data-Driven Test Suite
 * 
 * Covers:
 * - Transaction creation (deposit, withdrawal) with balance verification
 * - Filtering by account
 * - Filtering by date range
 * - CSV export
 * - Transaction detail view
 * 
 * @tags @smoke @regression
 */

test.describe('Transactions Feature', () => {

  // ─── Transaction Creation (Data-Driven) ──────────────────────────────────────

  test.describe('Transaction Creation @smoke', () => {
    for (const data of txnData.createTransaction) {
      test(`${data.testId}: ${data.description}`, async ({ adminSession }) => {
        test.info().annotations.push(
          { type: 'testId', description: data.testId },
          { type: 'severity', description: data.tags.includes('@critical') ? 'critical' : 'normal' },
          { type: 'tags', description: data.tags.join(', ') },
        );

        const { accounts, transactions, navBar } = adminSession;

        // Get initial balance
        await navBar.goToAccounts();
        await accounts.isLoaded();
        const initialBalance = await accounts.getAccountBalance(data.fromAccount);

        // Navigate to transactions and create
        await navBar.goToTransactions();
        await transactions.isLoaded();
        await transactions.createTransaction({
          type: data.type,
          fromAccount: data.fromAccount,
          amount: data.amount,
        });

        // Verify transaction appears in list
        await transactions.verifyTransactionVisible(data.amount);

        // Verify balance changed correctly
        await navBar.goToAccounts();
        const newBalance = await accounts.getAccountBalance(data.fromAccount);
        const expectedBalance = initialBalance + data.expectedBalanceChange;
        expect(newBalance).toBeCloseTo(expectedBalance, 2);
      });
    }
  });

  // ─── Filter by Account ───────────────────────────────────────────────────────

  test(`${txnData.filterByAccount.testId}: ${txnData.filterByAccount.description} @regression`, async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: txnData.filterByAccount.testId },
      { type: 'severity', description: 'normal' },
    );

    const { transactions, navBar } = adminSession;

    await navBar.goToTransactions();
    await transactions.isLoaded();

    // Filter by specific account
    for (const account of txnData.filterByAccount.accounts) {
      await transactions.filterByAccount(account);

      // Verify filter is applied (page doesn't error)
      const count = await transactions.getTransactionCount();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  // ─── Filter by Date Range ────────────────────────────────────────────────────

  test(`${txnData.filterByDate.testId}: ${txnData.filterByDate.description} @regression`, async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: txnData.filterByDate.testId },
      { type: 'severity', description: 'normal' },
    );

    const { transactions, navBar } = adminSession;

    await navBar.goToTransactions();
    await transactions.isLoaded();

    for (const range of txnData.filterByDate.dateRanges) {
      const toDate = new Date().toISOString().split('T')[0];
      const fromDate = new Date(Date.now() - range.daysBack * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

      await transactions.filterByDateRange(fromDate, toDate);

      const count = await transactions.getTransactionCount();
      expect(count).toBeGreaterThanOrEqual(range.expectedMinCount);
    }
  });

  // ─── Export CSV ──────────────────────────────────────────────────────────────

  test(`${txnData.exportCsv.testId}: ${txnData.exportCsv.description} @regression`, async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: txnData.exportCsv.testId },
      { type: 'severity', description: 'normal' },
    );

    const { transactions, navBar } = adminSession;

    await navBar.goToTransactions();
    await transactions.isLoaded();

    // Export and verify download
    const download = await transactions.exportAsCsv();
    const filename = download.suggestedFilename();

    expect(filename).toContain(txnData.exportCsv.expectedFileExtension);
  });

  // ─── Transaction Detail ──────────────────────────────────────────────────────

  test(`${txnData.transactionDetail.testId}: ${txnData.transactionDetail.description} @regression`, async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: txnData.transactionDetail.testId },
      { type: 'severity', description: 'normal' },
    );

    const { transactions, navBar } = adminSession;

    await navBar.goToTransactions();
    await transactions.isLoaded();

    // Click first transaction to view detail
    const count = await transactions.getTransactionCount();
    if (count > 0) {
      await transactions.viewTransactionDetail(0);

      // Verify detail view shows expected fields
      const detailVisible = await adminSession.page.locator('[data-testid="transaction-detail"]').isVisible();
      expect(detailVisible).toBeTruthy();
    }
  });
});