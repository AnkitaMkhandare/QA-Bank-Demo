const { test, expect } = require('@playwright/test');
const { BankApiService, SchemaValidator } = require('../../src/api');

/**
 * Transactions API — Test Suite
 * 
 * Validates transaction management API endpoints:
 * - GET /transactions (list with filters)
 * - GET /transactions/:id (detail)
 * - POST /transactions (create deposit/withdrawal)
 * - Schema validation for all responses
 * - Business logic validation (balance updates)
 * 
 * @tags @api @regression
 */

test.describe('Transactions API @api', () => {
  let bankApi;
  let validator;
  let testAccountId;
  let createdTransactionId;

  test.beforeAll(async () => {
    bankApi = new BankApiService();
    validator = new SchemaValidator();
    await bankApi.init();
    await bankApi.login('admin', 'admin123');

    // Setup: Create a test account for transaction tests
    try {
      const account = await bankApi.createAccount({
        name: `Txn Test Account ${Date.now()}`,
        type: 'savings',
        deposit: 5000,
      });
      testAccountId = account.id;
    } catch (error) {
      // If API doesn't support account creation, use existing
      const accounts = await bankApi.getAccounts();
      if (accounts.length > 0) {
        testAccountId = accounts[0].id;
      }
    }
  });

  test.afterAll(async () => {
    // Cleanup
    if (testAccountId) {
      await bankApi.cleanupAccount(testAccountId);
    }
    await bankApi.dispose();
  });

  // ─── GET /transactions ───────────────────────────────────────────────────────

  test('GET /transactions — returns transaction list with valid schema', async () => {
    test.info().annotations.push(
      { type: 'testId', description: 'API-TXN-01' },
      { type: 'severity', description: 'critical' },
    );

    const transactions = await bankApi.getTransactions();

    // Validate response is an array
    expect(Array.isArray(transactions)).toBeTruthy();

    // Schema validation (if results exist)
    if (transactions.length > 0) {
      const result = validator.validate(transactions, SchemaValidator.schemas.transactionList);
      expect(result.valid).toBeTruthy();
    }
  });

  // ─── POST /transactions (Deposit) ────────────────────────────────────────────

  test('POST /transactions — creates deposit and updates balance', async () => {
    test.info().annotations.push(
      { type: 'testId', description: 'API-TXN-02' },
      { type: 'severity', description: 'critical' },
    );

    test.skip(!testAccountId, 'No test account available');

    // Get balance before
    const accountBefore = await bankApi.getAccountById(testAccountId);
    const balanceBefore = accountBefore.balance;

    // Create deposit
    const depositAmount = 250;
    const txn = await bankApi.createTransaction({
      type: 'Deposit',
      accountId: testAccountId,
      amount: depositAmount,
      description: 'API test deposit',
    });

    createdTransactionId = txn.id;

    // Validate transaction response
    expect(txn).toHaveProperty('id');
    expect(txn).toHaveProperty('type');
    expect(txn).toHaveProperty('amount');

    // Schema validation
    const result = validator.validate(txn, SchemaValidator.schemas.transaction);
    expect(result.valid).toBeTruthy();

    // Validate balance updated
    const accountAfter = await bankApi.getAccountById(testAccountId);
    expect(accountAfter.balance).toBeCloseTo(balanceBefore + depositAmount, 2);
  });

  // ─── POST /transactions (Withdrawal) ─────────────────────────────────────────

  test('POST /transactions — creates withdrawal and updates balance', async () => {
    test.info().annotations.push(
      { type: 'testId', description: 'API-TXN-03' },
      { type: 'severity', description: 'normal' },
    );

    test.skip(!testAccountId, 'No test account available');

    // Get balance before
    const accountBefore = await bankApi.getAccountById(testAccountId);
    const balanceBefore = accountBefore.balance;

    // Create withdrawal
    const withdrawalAmount = 100;
    const txn = await bankApi.createTransaction({
      type: 'Withdrawal',
      accountId: testAccountId,
      amount: withdrawalAmount,
      description: 'API test withdrawal',
    });

    // Validate transaction
    expect(txn).toHaveProperty('id');

    // Validate balance decreased
    const accountAfter = await bankApi.getAccountById(testAccountId);
    expect(accountAfter.balance).toBeCloseTo(balanceBefore - withdrawalAmount, 2);
  });

  // ─── GET /transactions/:id ───────────────────────────────────────────────────

  test('GET /transactions/:id — returns specific transaction details', async () => {
    test.info().annotations.push(
      { type: 'testId', description: 'API-TXN-04' },
      { type: 'severity', description: 'normal' },
    );

    test.skip(!createdTransactionId, 'No transaction available to fetch');

    const txn = await bankApi.getTransactionById(createdTransactionId);

    expect(txn.id).toBe(createdTransactionId);

    // Schema validation
    const result = validator.validate(txn, SchemaValidator.schemas.transaction);
    expect(result.valid).toBeTruthy();
  });

  // ─── GET /transactions?accountId= ────────────────────────────────────────────

  test('GET /transactions — filters by account ID', async () => {
    test.info().annotations.push(
      { type: 'testId', description: 'API-TXN-05' },
      { type: 'severity', description: 'normal' },
    );

    test.skip(!testAccountId, 'No test account available');

    const transactions = await bankApi.getTransactions({ accountId: testAccountId });

    expect(Array.isArray(transactions)).toBeTruthy();

    // All returned transactions should belong to the test account
    for (const txn of transactions) {
      if (txn.accountId) {
        expect(txn.accountId).toBe(testAccountId);
      }
    }
  });

  // ─── Error Handling ──────────────────────────────────────────────────────────

  test('GET /transactions/:id — returns 404 for non-existent transaction', async () => {
    test.info().annotations.push(
      { type: 'testId', description: 'API-TXN-06' },
      { type: 'severity', description: 'normal' },
    );

    const { status } = await bankApi.rawRequest('GET', '/transactions/non-existent-txn-99999');
    expect(status).toBe(404);
  });

  test('POST /transactions — returns error for insufficient funds', async () => {
    test.info().annotations.push(
      { type: 'testId', description: 'API-TXN-07' },
      { type: 'severity', description: 'normal' },
    );

    test.skip(!testAccountId, 'No test account available');

    const { status } = await bankApi.rawRequest('POST', '/transactions', {
      body: {
        type: 'Withdrawal',
        accountId: testAccountId,
        amount: 9999999, // More than available balance
      },
    });

    // Expect 400/422 for insufficient funds
    expect([400, 422, 403]).toContain(status);
  });

  test('POST /transactions — returns error for negative amount', async () => {
    test.info().annotations.push(
      { type: 'testId', description: 'API-TXN-08' },
      { type: 'severity', description: 'normal' },
    );

    const { status } = await bankApi.rawRequest('POST', '/transactions', {
      body: {
        type: 'Deposit',
        accountId: testAccountId || 'any-id',
        amount: -500,
      },
    });

    expect([400, 422]).toContain(status);
  });
});