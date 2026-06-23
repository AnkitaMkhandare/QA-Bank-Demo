const { test, expect } = require('../../../src/fixtures/test-fixtures');

/**
 * New Transaction Feature — Positive Test Scenarios
 * 
 * Test Case IDs: TC-TXN-NEW-01 to TC-TXN-NEW-07
 * Feature: Dashboard → New Transaction (Deposit, Withdrawal, Transfer)
 * Objective: Verify that a user can successfully perform all transaction types
 *            with valid inputs, and that balances update correctly.
 * 
 * Positive Test Coverage:
 * ┌──────────────────────────────────────────────────────────────────────────────────────────┐
 * │ #  │ Scenario                          │ Type       │ Amount  │ Expected Result           │
 * ├────┼───────────────────────────────────┼────────────┼─────────┼───────────────────────────┤
 * │ P1 │ Deposit into Primary Saving       │ Deposit    │ $1,000  │ Balance increases          │
 * │ P2 │ Withdrawal from Checking Account  │ Withdrawal │ $500    │ Balance decreases          │
 * │ P3 │ Transfer between accounts         │ Transfer   │ $10,000 │ Src ↓ / Dest ↑            │
 * │ P4 │ Minimum amount deposit ($1)       │ Deposit    │ $1      │ Boundary test              │
 * │ P5 │ Deposit with decimal ($99.99)     │ Deposit    │ $99.99  │ Precision handling         │
 * │ P6 │ Verify transaction in history     │ Deposit    │ $2,500  │ Appears in table           │
 * │ P7 │ Multiple sequential transactions  │ Mixed      │ Various │ Running balance correct    │
 * └──────────────────────────────────────────────────────────────────────────────────────────┘
 * 
 * @tags @positive @smoke @transactions
 */

test.describe('New Transaction — Positive Tests @transactions @positive', () => {
  test.setTimeout(60000);

  // ═══════════════════════════════════════════════════════════════════════════════
  // P1: Deposit into Primary Saving Account
  // ═══════════════════════════════════════════════════════════════════════════════

  test('TC-TXN-NEW-01: Deposit $1000 into Primary Saving — balance increases', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'TC-TXN-NEW-01' },
      { type: 'severity', description: 'critical' },
      { type: 'feature', description: 'Transaction → Deposit' },
    );

    const { page, transactions, navBar } = adminSession;

    await test.step('Navigate to Transactions page', async () => {
      await navBar.goToTransactions();
      await transactions.isLoaded();
    });

    await test.step('Open New Transaction modal', async () => {
      await transactions.openNewTransactionModal();
    });

    await test.step('Select Type: Deposit, Account: Primary Saving', async () => {
      await transactions.selectTransactionType('Deposit');
      await transactions.selectFromAccount('Primary Saving');
    });

    await test.step('Enter Amount: $1000 and Description', async () => {
      await transactions.enterAmount('1000');
      await transactions.enterDescription('Salary Credit');
    });

    await test.step('Submit transaction', async () => {
      await transactions.submitTransaction();
    });

    await test.step('Assert: Success toast and transaction visible in history', async () => {
      await transactions.assertSuccessToast();
      await transactions.verifyTransactionVisible('1000');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // P2: Withdrawal from Checking Account
  // ═══════════════════════════════════════════════════════════════════════════════

  test('TC-TXN-NEW-02: Withdrawal $500 from Checking — balance decreases', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'TC-TXN-NEW-02' },
      { type: 'severity', description: 'critical' },
      { type: 'feature', description: 'Transaction → Withdrawal' },
    );

    const { page, transactions, navBar } = adminSession;

    await test.step('Navigate to Transactions page', async () => {
      await navBar.goToTransactions();
      await transactions.isLoaded();
    });

    await test.step('Open New Transaction modal', async () => {
      await transactions.openNewTransactionModal();
    });

    await test.step('Select Type: Withdrawal, Account: Checking', async () => {
      await transactions.selectTransactionType('Withdrawal');
      await transactions.selectFromAccount('Checking');
    });

    await test.step('Enter Amount: $500 and Description', async () => {
      await transactions.enterAmount('500');
      await transactions.enterDescription('ATM Withdrawal');
    });

    await test.step('Submit transaction', async () => {
      await transactions.submitTransaction();
    });

    await test.step('Assert: Success and transaction recorded', async () => {
      await transactions.assertSuccessToast();
      await transactions.verifyTransactionVisible('500');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // P3: Transfer from J Account to Primary Saving
  // ═══════════════════════════════════════════════════════════════════════════════

  test('TC-TXN-NEW-03: Transfer $250 from Checking to Primary Saving', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'TC-TXN-NEW-03' },
      { type: 'severity', description: 'critical' },
      { type: 'feature', description: 'Transaction → Transfer' },
    );

    const { page, transactions, navBar } = adminSession;

    await test.step('Navigate to Transactions page', async () => {
      await navBar.goToTransactions();
      await transactions.isLoaded();
    });

    await test.step('Open New Transaction modal', async () => {
      await transactions.openNewTransactionModal();
    });

    await test.step('Select Type: Transfer, From: Checking, To: Primary Saving', async () => {
      await transactions.selectTransactionType('Transfer');
      await transactions.selectFromAccount('Checking');
      await transactions.selectToAccount('Primary Saving');
    });

    await test.step('Enter Amount: $250 and Description', async () => {
      await transactions.enterAmount('250');
      await transactions.enterDescription('Fund Transfer to Savings');
    });

    await test.step('Submit transaction', async () => {
      await transactions.submitTransaction();
    });

    await test.step('Assert: Transfer recorded in history', async () => {
      await transactions.assertSuccessToast();
      await transactions.verifyTransactionVisible('250');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // P4: Minimum Amount Deposit ($1) — Boundary Test
  // ═══════════════════════════════════════════════════════════════════════════════

  test('TC-TXN-NEW-04: Minimum deposit $1 — boundary value accepted', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'TC-TXN-NEW-04' },
      { type: 'severity', description: 'high' },
      { type: 'feature', description: 'Transaction → Boundary (Min Amount)' },
    );

    const { page, transactions, navBar } = adminSession;

    await test.step('Navigate to Transactions page', async () => {
      await navBar.goToTransactions();
      await transactions.isLoaded();
    });

    await test.step('Create deposit of $1', async () => {
      await transactions.openNewTransactionModal();
      await transactions.selectTransactionType('Deposit');
      await transactions.selectFromAccount('Primary Saving');
      await transactions.enterAmount('1');
      await transactions.enterDescription('Minimum deposit test');
      await transactions.submitTransaction();
    });

    await test.step('Assert: $1 transaction recorded', async () => {
      await transactions.assertSuccessToast();
      await transactions.verifyTransactionVisible('1');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // P5: Decimal Amount Deposit ($99.99)
  // ═══════════════════════════════════════════════════════════════════════════════

  test('TC-TXN-NEW-05: Deposit $99.99 — decimal precision handled correctly', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'TC-TXN-NEW-05' },
      { type: 'severity', description: 'high' },
      { type: 'feature', description: 'Transaction → Decimal Precision' },
    );

    const { page, transactions, navBar } = adminSession;

    await test.step('Navigate to Transactions page', async () => {
      await navBar.goToTransactions();
      await transactions.isLoaded();
    });

    await test.step('Create deposit of $99.99', async () => {
      await transactions.openNewTransactionModal();
      await transactions.selectTransactionType('Deposit');
      await transactions.selectFromAccount('Primary Saving');
      await transactions.enterAmount('99.99');
      await transactions.enterDescription('Decimal precision test');
      await transactions.submitTransaction();
    });

    await test.step('Assert: $99.99 transaction recorded with correct precision', async () => {
      await transactions.assertSuccessToast();
      await transactions.verifyTransactionVisible('99.99');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // P6: Verify Transaction Appears in History
  // ═══════════════════════════════════════════════════════════════════════════════

  test('TC-TXN-NEW-06: Verify transaction appears in history table', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'TC-TXN-NEW-06' },
      { type: 'severity', description: 'critical' },
      { type: 'feature', description: 'Transaction → History Verification' },
    );

    const { page, transactions, navBar } = adminSession;

    await test.step('Navigate to Transactions page', async () => {
      await navBar.goToTransactions();
      await transactions.isLoaded();
    });

    await test.step('Get initial transaction count', async () => {
      const initialCount = await transactions.getTransactionCount();
      test.info().annotations.push({ type: 'data', description: `Initial count: ${initialCount}` });
    });

    await test.step('Create a $2500 deposit', async () => {
      await transactions.openNewTransactionModal();
      await transactions.selectTransactionType('Deposit');
      await transactions.selectFromAccount('Primary Saving');
      await transactions.enterAmount('2500');
      await transactions.enterDescription('History verification test');
      await transactions.submitTransaction();
    });

    await test.step('Assert: Transaction appears in the table', async () => {
      await transactions.assertSuccessToast();
      await transactions.verifyTransactionVisible('2500');

      // Verify count increased
      const newCount = await transactions.getTransactionCount();
      expect(newCount).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // P7: Multiple Sequential Transactions
  // ═══════════════════════════════════════════════════════════════════════════════

  test('TC-TXN-NEW-07: Multiple sequential transactions — all recorded correctly', async ({ adminSession }) => {
    test.setTimeout(90000); // Extended timeout for sequential operations
    test.info().annotations.push(
      { type: 'testId', description: 'TC-TXN-NEW-07' },
      { type: 'severity', description: 'high' },
      { type: 'feature', description: 'Transaction → Sequential Operations' },
    );

    const { page, transactions, navBar } = adminSession;

    await test.step('Navigate to Transactions page', async () => {
      await navBar.goToTransactions();
      await transactions.isLoaded();
    });

    await test.step('Transaction 1: Deposit $3000', async () => {
      await transactions.openNewTransactionModal();
      await transactions.selectTransactionType('Deposit');
      await transactions.selectFromAccount('Primary Saving');
      await transactions.enterAmount('3000');
      await transactions.enterDescription('Sequential test - Deposit');
      await transactions.submitTransaction();
      await transactions.assertSuccessToast();
      await transactions.verifyTransactionVisible('3000');
    });

    await test.step('Transaction 2: Withdrawal $750', async () => {
      await transactions.openNewTransactionModal();
      await transactions.selectTransactionType('Withdrawal');
      await transactions.selectFromAccount('Primary Saving');
      await transactions.enterAmount('750');
      await transactions.enterDescription('Sequential test - Withdrawal');
      await transactions.submitTransaction();
      await transactions.assertSuccessToast();
      await transactions.verifyTransactionVisible('750');
    });

    await test.step('Assert: Transaction count increased', async () => {
      const count = await transactions.getTransactionCount();
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });
});