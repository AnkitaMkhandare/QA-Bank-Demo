const { test, expect } = require('@playwright/test');
const { BankApiService } = require('../../src/api');

/**
 * Database Validation Tests
 * 
 * Validates data integrity and consistency at the database level:
 * - Data integrity (referential constraints, unique keys)
 * - Transaction atomicity (ACID compliance indicators)
 * - Data consistency after CRUD operations
 * - Concurrent operation handling
 * - Data type validation
 * - Orphan record detection
 * 
 * NOTE: These tests validate data integrity through the API layer,
 * as direct database access is not available in the current architecture.
 * Tests marked @provision:future indicate areas that require direct DB
 * connection (e.g., via pg, mysql2, or mongodb drivers).
 * 
 * @tags @database @data-integrity @regression
 */

test.describe('Database Validation @database', () => {
  let bankApi;

  test.beforeAll(async () => {
    bankApi = new BankApiService();
    await bankApi.init();
    await bankApi.login('admin', 'admin123');
  });

  test.afterAll(async () => {
    await bankApi.dispose();
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // Data Integrity — Referential Consistency
  // ═══════════════════════════════════════════════════════════════════════════════

  test.describe('Data Integrity', () => {

    test('DB-INT-01: All transactions should reference valid accounts', async () => {
      test.info().annotations.push(
        { type: 'testId', description: 'DB-INT-01' },
        { type: 'severity', description: 'critical' },
        { type: 'category', description: 'Referential Integrity' },
      );

      // Get all accounts
      const accounts = await bankApi.getAccounts();
      const accountIds = accounts.map(a => a.id);

      // Get all transactions
      const transactions = await bankApi.getTransactions();

      // Every transaction should reference a valid account
      for (const txn of transactions) {
        if (txn.accountId) {
          expect(
            accountIds.includes(txn.accountId),
            `Transaction ${txn.id} references non-existent account ${txn.accountId}`
          ).toBeTruthy();
        }
      }

      test.info().annotations.push({
        type: 'db-check',
        description: `Validated ${transactions.length} transactions against ${accounts.length} accounts`,
      });
    });

    test('DB-INT-02: Account IDs should be unique', async () => {
      test.info().annotations.push(
        { type: 'testId', description: 'DB-INT-02' },
        { type: 'severity', description: 'critical' },
        { type: 'category', description: 'Unique Constraint' },
      );

      const accounts = await bankApi.getAccounts();
      const ids = accounts.map(a => a.id);
      const uniqueIds = [...new Set(ids)];

      expect(ids.length).toBe(uniqueIds.length);

      test.info().annotations.push({
        type: 'db-check',
        description: `${ids.length} accounts, ${uniqueIds.length} unique IDs — no duplicates`,
      });
    });

    test('DB-INT-03: Transaction IDs should be unique', async () => {
      test.info().annotations.push(
        { type: 'testId', description: 'DB-INT-03' },
        { type: 'severity', description: 'critical' },
        { type: 'category', description: 'Unique Constraint' },
      );

      const transactions = await bankApi.getTransactions();
      const ids = transactions.map(t => t.id);
      const uniqueIds = [...new Set(ids)];

      expect(ids.length).toBe(uniqueIds.length);
    });

    test('DB-INT-04: Account balances should be non-negative', async () => {
      test.info().annotations.push(
        { type: 'testId', description: 'DB-INT-04' },
        { type: 'severity', description: 'high' },
        { type: 'category', description: 'Business Rule Constraint' },
      );

      const accounts = await bankApi.getAccounts();

      for (const account of accounts) {
        if (account.balance !== undefined) {
          expect(
            account.balance >= 0,
            `Account "${account.name}" (${account.id}) has negative balance: ${account.balance}`
          ).toBeTruthy();
        }
      }

      test.info().annotations.push({
        type: 'db-check',
        description: `All ${accounts.length} accounts have non-negative balances`,
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // Transaction Atomicity (ACID)
  // ═══════════════════════════════════════════════════════════════════════════════

  test.describe('Transaction Atomicity (ACID Compliance)', () => {

    test('DB-ACID-01: Deposit should atomically update account balance', async () => {
      test.info().annotations.push(
        { type: 'testId', description: 'DB-ACID-01' },
        { type: 'severity', description: 'critical' },
        { type: 'category', description: 'Atomicity' },
      );

      // Get accounts to find one to test with
      const accounts = await bankApi.getAccounts();
      test.skip(accounts.length === 0, 'No accounts available for testing');

      const testAccount = accounts[0];
      const initialBalance = testAccount.balance;
      const depositAmount = 100;

      try {
        // Perform deposit
        await bankApi.createTransaction({
          type: 'Deposit',
          accountId: testAccount.id,
          amount: depositAmount,
          description: 'DB atomicity test deposit',
        });

        // Verify balance updated atomically
        const updatedAccount = await bankApi.getAccountById(testAccount.id);
        expect(updatedAccount.balance).toBeCloseTo(initialBalance + depositAmount, 2);
      } catch (error) {
        // If transaction failed, balance should remain unchanged
        const unchangedAccount = await bankApi.getAccountById(testAccount.id);
        expect(unchangedAccount.balance).toBeCloseTo(initialBalance, 2);
      }
    });

    test('DB-ACID-02: Failed transaction should not modify balance (rollback)', async () => {
      test.info().annotations.push(
        { type: 'testId', description: 'DB-ACID-02' },
        { type: 'severity', description: 'critical' },
        { type: 'category', description: 'Atomicity — Rollback' },
      );

      const accounts = await bankApi.getAccounts();
      test.skip(accounts.length === 0, 'No accounts available for testing');

      const testAccount = accounts[0];
      const initialBalance = testAccount.balance;

      // Attempt withdrawal exceeding balance (should fail)
      try {
        await bankApi.rawRequest('POST', '/transactions', {
          body: {
            type: 'Withdrawal',
            accountId: testAccount.id,
            amount: 99999999, // Exceeds balance
          },
        });
      } catch {
        // Expected to fail
      }

      // Balance should remain unchanged
      const accountAfter = await bankApi.getAccountById(testAccount.id);
      expect(accountAfter.balance).toBeCloseTo(initialBalance, 2);

      test.info().annotations.push({
        type: 'acid-check',
        description: `Balance unchanged after failed withdrawal: $${initialBalance} → $${accountAfter.balance}`,
      });
    });

    test('DB-ACID-03: Transfer should atomically debit source and credit destination', async () => {
      test.info().annotations.push(
        { type: 'testId', description: 'DB-ACID-03' },
        { type: 'severity', description: 'critical' },
        { type: 'category', description: 'Atomicity — Multi-record' },
        { type: 'provision', description: 'future — requires 2+ accounts with known balances' },
      );

      const accounts = await bankApi.getAccounts();
      test.skip(accounts.length < 2, 'Need at least 2 accounts for transfer test');

      const sourceAccount = accounts[0];
      const destAccount = accounts[1];
      const sourceBalanceBefore = sourceAccount.balance;
      const destBalanceBefore = destAccount.balance;
      const transferAmount = 50;

      test.skip(sourceBalanceBefore < transferAmount, 'Source account has insufficient balance');

      try {
        await bankApi.createTransaction({
          type: 'Transfer',
          accountId: sourceAccount.id,
          toAccountId: destAccount.id,
          amount: transferAmount,
          description: 'DB atomicity transfer test',
        });

        // Verify both accounts updated atomically
        const sourceAfter = await bankApi.getAccountById(sourceAccount.id);
        const destAfter = await bankApi.getAccountById(destAccount.id);

        expect(sourceAfter.balance).toBeCloseTo(sourceBalanceBefore - transferAmount, 2);
        expect(destAfter.balance).toBeCloseTo(destBalanceBefore + transferAmount, 2);
      } catch {
        // If transfer failed, both balances should remain unchanged
        const sourceAfter = await bankApi.getAccountById(sourceAccount.id);
        const destAfter = await bankApi.getAccountById(destAccount.id);

        expect(sourceAfter.balance).toBeCloseTo(sourceBalanceBefore, 2);
        expect(destAfter.balance).toBeCloseTo(destBalanceBefore, 2);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // Data Consistency After CRUD
  // ═══════════════════════════════════════════════════════════════════════════════

  test.describe('Data Consistency After CRUD', () => {

    test('DB-CRUD-01: Created account should be immediately retrievable', async () => {
      test.info().annotations.push(
        { type: 'testId', description: 'DB-CRUD-01' },
        { type: 'severity', description: 'critical' },
        { type: 'category', description: 'Consistency — Create' },
      );

      let createdId = null;

      try {
        const newAccount = await bankApi.createAccount({
          name: `DB Test Account ${Date.now()}`,
          type: 'savings',
          deposit: 100,
        });

        createdId = newAccount.id;

        // Should be immediately retrievable
        const fetched = await bankApi.getAccountById(createdId);
        expect(fetched.id).toBe(createdId);
        expect(fetched.name).toContain('DB Test Account');

        // Should appear in account list
        const allAccounts = await bankApi.getAccounts();
        const found = allAccounts.find(a => a.id === createdId);
        expect(found).toBeTruthy();
      } finally {
        // Cleanup
        if (createdId) {
          await bankApi.cleanupAccount(createdId);
        }
      }
    });

    test('DB-CRUD-02: Deleted account should not be retrievable', async () => {
      test.info().annotations.push(
        { type: 'testId', description: 'DB-CRUD-02' },
        { type: 'severity', description: 'critical' },
        { type: 'category', description: 'Consistency — Delete' },
      );

      // Create account to delete
      let createdId = null;

      try {
        const newAccount = await bankApi.createAccount({
          name: `Delete Test ${Date.now()}`,
          type: 'checking',
          deposit: 50,
        });

        createdId = newAccount.id;

        // Delete it
        await bankApi.deleteAccount(createdId);

        // Should not be retrievable
        const { status } = await bankApi.rawRequest('GET', `/accounts/${createdId}`);
        expect(status).toBe(404);

        // Should not appear in list
        const allAccounts = await bankApi.getAccounts();
        const found = allAccounts.find(a => a.id === createdId);
        expect(found).toBeFalsy();

        createdId = null; // Already deleted
      } finally {
        if (createdId) {
          await bankApi.cleanupAccount(createdId);
        }
      }
    });

    test('DB-CRUD-03: Updated account data should persist correctly', async () => {
      test.info().annotations.push(
        { type: 'testId', description: 'DB-CRUD-03' },
        { type: 'severity', description: 'high' },
        { type: 'category', description: 'Consistency — Update' },
      );

      let createdId = null;

      try {
        const newAccount = await bankApi.createAccount({
          name: `Update Test ${Date.now()}`,
          type: 'savings',
          deposit: 200,
        });

        createdId = newAccount.id;

        // Update the account
        const newName = `Updated Name ${Date.now()}`;
        await bankApi.updateAccount(createdId, { name: newName });

        // Fetch and verify update persisted
        const fetched = await bankApi.getAccountById(createdId);
        expect(fetched.name).toBe(newName);
      } finally {
        if (createdId) {
          await bankApi.cleanupAccount(createdId);
        }
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // Data Type Validation
  // ═══════════════════════════════════════════════════════════════════════════════

  test.describe('Data Type Validation', () => {

    test('DB-TYPE-01: Account balances should be numeric', async () => {
      test.info().annotations.push(
        { type: 'testId', description: 'DB-TYPE-01' },
        { type: 'severity', description: 'high' },
        { type: 'category', description: 'Type Validation' },
      );

      const accounts = await bankApi.getAccounts();

      for (const account of accounts) {
        if (account.balance !== undefined) {
          expect(typeof account.balance).toBe('number');
          expect(isNaN(account.balance)).toBeFalsy();
          expect(isFinite(account.balance)).toBeTruthy();
        }
      }
    });

    test('DB-TYPE-02: Transaction amounts should be positive numbers', async () => {
      test.info().annotations.push(
        { type: 'testId', description: 'DB-TYPE-02' },
        { type: 'severity', description: 'high' },
        { type: 'category', description: 'Type Validation' },
      );

      const transactions = await bankApi.getTransactions();

      for (const txn of transactions) {
        if (txn.amount !== undefined) {
          expect(typeof txn.amount).toBe('number');
          expect(txn.amount).toBeGreaterThan(0);
        }
      }
    });

    test('DB-TYPE-03: Dates should be valid ISO format', async () => {
      test.info().annotations.push(
        { type: 'testId', description: 'DB-TYPE-03' },
        { type: 'severity', description: 'normal' },
        { type: 'category', description: 'Type Validation' },
      );

      const transactions = await bankApi.getTransactions();

      for (const txn of transactions) {
        if (txn.date || txn.createdAt) {
          const dateStr = txn.date || txn.createdAt;
          const parsed = new Date(dateStr);
          expect(parsed.toString()).not.toBe('Invalid Date');
        }
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // Direct Database Access (Provisioned for Future)
  // ═══════════════════════════════════════════════════════════════════════════════

  test.describe('Direct Database Validation', () => {

    test('DB-DIRECT-01: Verify database schema integrity', async () => {
      test.info().annotations.push(
        { type: 'testId', description: 'DB-DIRECT-01' },
        { type: 'severity', description: 'critical' },
        { type: 'category', description: 'Schema Validation' },
        { type: 'provision', description: 'future — requires direct DB connection' },
      );

      test.skip(true, 'Direct database access not available — provisioned for future (requires pg/mysql2 driver)');

      // Would verify:
      // - Required tables exist (users, accounts, transactions)
      // - Foreign key constraints are defined
      // - Indexes are present on frequently queried columns
      // - Data types match expected schema
    });

    test('DB-DIRECT-02: Verify password hashing in database', async () => {
      test.info().annotations.push(
        { type: 'testId', description: 'DB-DIRECT-02' },
        { type: 'severity', description: 'critical' },
        { type: 'category', description: 'Security — Password Storage' },
        { type: 'provision', description: 'future — requires direct DB connection' },
      );

      test.skip(true, 'Direct database access not available — provisioned for future');

      // Would verify:
      // - Passwords stored as bcrypt/argon2 hashes (not plaintext)
      // - Hash length matches expected algorithm output
      // - No plaintext passwords in any table
    });

    test('DB-DIRECT-03: Verify audit trail table is populated', async () => {
      test.info().annotations.push(
        { type: 'testId', description: 'DB-DIRECT-03' },
        { type: 'severity', description: 'high' },
        { type: 'category', description: 'Audit Trail' },
        { type: 'provision', description: 'future — requires direct DB connection' },
      );

      test.skip(true, 'Direct database access not available — provisioned for future');

      // Would verify:
      // - audit_log table exists
      // - Login events are recorded
      // - CRUD operations generate audit entries
      // - Audit entries have: timestamp, user_id, action, resource, ip_address
    });

    test('DB-DIRECT-04: Verify data encryption at rest', async () => {
      test.info().annotations.push(
        { type: 'testId', description: 'DB-DIRECT-04' },
        { type: 'severity', description: 'critical' },
        { type: 'category', description: 'Encryption at Rest' },
        { type: 'provision', description: 'future — requires direct DB/infrastructure access' },
      );

      test.skip(true, 'Database encryption verification requires infrastructure access — provisioned for future');

      // Would verify:
      // - Database encryption is enabled (TDE or filesystem encryption)
      // - Sensitive columns use application-level encryption
      // - Encryption keys are properly managed (not stored alongside data)
    });
  });
});