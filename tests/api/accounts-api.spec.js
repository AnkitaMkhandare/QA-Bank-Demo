const { test, expect } = require('@playwright/test');
const { BankApiService, SchemaValidator } = require('../../src/api');

/**
 * Accounts API — Test Suite
 * 
 * Validates account management API endpoints:
 * - GET /accounts (list)
 * - GET /accounts/:id (detail)
 * - POST /accounts (create)
 * - PUT /accounts/:id (update)
 * - DELETE /accounts/:id (remove)
 * - Schema validation for all responses
 * 
 * @tags @api @regression
 */

test.describe('Accounts API @api', () => {
  let bankApi;
  let validator;
  let createdAccountId;

  test.beforeAll(async () => {
    bankApi = new BankApiService();
    validator = new SchemaValidator();
    await bankApi.init();
    await bankApi.login('admin', 'admin123');
  });

  test.afterAll(async () => {
    // Cleanup: remove test account if created
    if (createdAccountId) {
      await bankApi.cleanupAccount(createdAccountId);
    }
    await bankApi.dispose();
  });

  // ─── GET /accounts ───────────────────────────────────────────────────────────

  test('GET /accounts — returns list of accounts with valid schema', async () => {
    test.info().annotations.push(
      { type: 'testId', description: 'API-ACC-01' },
      { type: 'severity', description: 'critical' },
    );

    const accounts = await bankApi.getAccounts();

    // Validate response is an array
    expect(Array.isArray(accounts)).toBeTruthy();

    // Schema validation
    const result = validator.validate(accounts, SchemaValidator.schemas.accountList);
    expect(result.valid).toBeTruthy();
  });

  // ─── POST /accounts ──────────────────────────────────────────────────────────

  test('POST /accounts — creates new account with correct data', async () => {
    test.info().annotations.push(
      { type: 'testId', description: 'API-ACC-02' },
      { type: 'severity', description: 'critical' },
    );

    const newAccount = await bankApi.createAccount({
      name: `API Test Account ${Date.now()}`,
      type: 'savings',
      deposit: 750,
    });

    // Store for cleanup
    createdAccountId = newAccount.id;

    // Validate response structure
    expect(newAccount).toHaveProperty('id');
    expect(newAccount).toHaveProperty('name');
    expect(newAccount).toHaveProperty('type');
    expect(newAccount).toHaveProperty('balance');

    // Schema validation
    const result = validator.validate(newAccount, SchemaValidator.schemas.account);
    expect(result.valid).toBeTruthy();

    // Business logic validation
    expect(newAccount.balance).toBeGreaterThanOrEqual(750);
  });

  // ─── GET /accounts/:id ───────────────────────────────────────────────────────

  test('GET /accounts/:id — returns specific account details', async () => {
    test.info().annotations.push(
      { type: 'testId', description: 'API-ACC-03' },
      { type: 'severity', description: 'normal' },
    );

    // Skip if no account was created
    test.skip(!createdAccountId, 'No account available to fetch');

    const account = await bankApi.getAccountById(createdAccountId);

    expect(account.id).toBe(createdAccountId);

    // Schema validation
    const result = validator.validate(account, SchemaValidator.schemas.account);
    expect(result.valid).toBeTruthy();
  });

  // ─── PUT /accounts/:id ───────────────────────────────────────────────────────

  test('PUT /accounts/:id — updates account name', async () => {
    test.info().annotations.push(
      { type: 'testId', description: 'API-ACC-04' },
      { type: 'severity', description: 'normal' },
    );

    test.skip(!createdAccountId, 'No account available to update');

    const updatedName = `Updated API Account ${Date.now()}`;
    const updated = await bankApi.updateAccount(createdAccountId, {
      name: updatedName,
    });

    expect(updated.name).toBe(updatedName);
    expect(updated.id).toBe(createdAccountId);
  });

  // ─── DELETE /accounts/:id ────────────────────────────────────────────────────

  test('DELETE /accounts/:id — removes account', async () => {
    test.info().annotations.push(
      { type: 'testId', description: 'API-ACC-05' },
      { type: 'severity', description: 'normal' },
    );

    test.skip(!createdAccountId, 'No account available to delete');

    const result = await bankApi.deleteAccount(createdAccountId);
    expect(result).toBeTruthy();

    // Clear reference so afterAll doesn't try to clean up again
    createdAccountId = null;
  });

  // ─── Error Handling ──────────────────────────────────────────────────────────

  test('GET /accounts/:id — returns 404 for non-existent account', async () => {
    test.info().annotations.push(
      { type: 'testId', description: 'API-ACC-06' },
      { type: 'severity', description: 'normal' },
    );

    const { status } = await bankApi.rawRequest('GET', '/accounts/non-existent-id-12345');
    expect(status).toBe(404);
  });

  test('POST /accounts — returns 400 for invalid data', async () => {
    test.info().annotations.push(
      { type: 'testId', description: 'API-ACC-07' },
      { type: 'severity', description: 'normal' },
    );

    const { status } = await bankApi.rawRequest('POST', '/accounts', {
      body: { name: '', type: 'invalid_type', deposit: -100 },
    });

    // Expect 400 Bad Request or 422 Unprocessable
    expect([400, 422]).toContain(status);
  });
});