const { test, expect } = require('../../../../src/fixtures/test-fixtures');

/**
 * Accounts Feature — Add Account via 3-Step Wizard
 * 
 * Test Case ID: TC_DASHBOARD_ADD_ACCOUNT
 * Feature: Dashboard → Add Account
 * Objective: Verify that a user can successfully add a new account 
 *            using the 3-step Open Account wizard.
 * 
 * Test Coverage:
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ Scenario │ Account Name       │ Type         │ Balance │ Status │        │
 * ├──────────┼────────────────────┼──────────────┼─────────┼────────┤        │
 * │ 1        │ Savings account    │ Savings      │ 5000    │ Active │        │
 * │ 2        │ Checking account   │ Checking     │ 10000   │ Active │        │
 * │ 3        │ credit card        │ Credit Card  │ 200000  │ Active │        │
 * └──────────────────────────────────────────────────────────────────────────┘
 * 
 * Each scenario follows the exact 10-step flow:
 *  1. Log in as admin and navigate to /bank/accounts
 *  2. Click 'Open New Account': data-testid='open-wizard-button'
 *  3. Assert the wizard dialog is open: data-testid='open-account-wizard'
 *  4. Assert step indicator shows 'Step 1 of 3': data-testid='wizard-step-indicator'
 *  5. Click the type card & assert data-selected='true'
 *  6. Click Next: data-testid='wizard-next' — assert step indicator 'Step 2 of 3'
 *  7. Fill Account Name & Initial Deposit
 *  8. Click Next — assert step indicator 'Step 3 of 3' and review summary visible
 *  9. Click 'Confirm & Open Account': data-testid='wizard-confirm'
 * 10. Assert success toast + account appears in the accounts table
 * 
 * @tags @smoke @regression @accounts
 */

test.describe('Accounts Feature — Add Account @accounts @smoke', () => {
  // Increase timeout for account tests (wizard + slowMo + toast discovery needs more time)
  test.setTimeout(60000);

  // ═══════════════════════════════════════════════════════════════════════════════
  // SCENARIO 1: Add Account with Savings Type
  // ═══════════════════════════════════════════════════════════════════════════════

  test('TC-ACC-01: Add Account with Savings Type — "Savings account" ($5000)', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'TC-ACC-01' },
      { type: 'severity', description: 'critical' },
      { type: 'feature', description: 'Dashboard → Add Account' },
    );

    const { page, accounts, navBar } = adminSession;

    // ── Step 1: Log in as admin and navigate to /bank/accounts ──
    await test.step('Step 1: Navigate to Accounts page', async () => {
      await navBar.goToAccounts();
      await accounts.isLoaded();
      expect(page.url()).toContain('bank/accounts');
    });

    // ── Step 2: Click 'Open New Account' ──
    await test.step('Step 2: Click "Open New Account" button', async () => {
      await accounts.openAccountWizard();
    });

    // ── Step 3: Assert the wizard dialog is open ──
    await test.step('Step 3: Assert wizard dialog is open', async () => {
      const wizard = page.locator('[data-testid="open-account-wizard"]');
      await expect(wizard).toBeVisible();
    });

    // ── Step 4: Assert step indicator shows 'Step 1 of 3' ──
    await test.step('Step 4: Assert step indicator shows "Step 1 of 3"', async () => {
      await accounts.assertStepIndicator('Step 1 of 3');
    });

    // ── Step 5: Click the Savings card & assert data-selected='true' ──
    await test.step('Step 5: Click Savings card and assert selected', async () => {
      await accounts.selectAccountType('savings');
      await accounts.assertTypeSelected('savings');
    });

    // ── Step 6: Click Next — assert step indicator shows 'Step 2 of 3' ──
    await test.step('Step 6: Click Next — assert "Step 2 of 3"', async () => {
      await accounts.clickWizardNext();
      await accounts.assertStepIndicator('Step 2 of 3');
    });

    // ── Step 7: Fill in Account Name and Initial Deposit ──
    await test.step('Step 7: Fill Account Name: "Savings account", Initial Deposit: 5000', async () => {
      await accounts.fillAccountDetails('Savings account', '5000');
    });

    // ── Step 8: Click Next — assert step indicator 'Step 3 of 3' and review summary ──
    await test.step('Step 8: Click Next — assert "Step 3 of 3" and review summary visible', async () => {
      await accounts.clickWizardNext();
      await accounts.assertStepIndicator('Step 3 of 3');
    });

    // ── Step 9: Click 'Confirm & Open Account' ──
    await test.step('Step 9: Click "Confirm & Open Account"', async () => {
      await accounts.confirmAccountCreation();
    });

    // ── Step 10: Assert success toast + account in table ──
    await test.step('Step 10: Assert success toast and account appears in table', async () => {
      await accounts.assertSuccessToast();
      const exists = await accounts.accountExists('Savings account');
      expect(exists, 'Account "Savings account" should appear in the accounts table').toBeTruthy();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // SCENARIO 2: Add Account with Checking Type
  // ═══════════════════════════════════════════════════════════════════════════════

  test('TC-ACC-02: Add Account with Checking Type — "Checking account" ($10000)', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'TC-ACC-02' },
      { type: 'severity', description: 'critical' },
      { type: 'feature', description: 'Dashboard → Add Account' },
    );

    const { page, accounts, navBar } = adminSession;

    // ── Step 1: Log in as admin and navigate to /bank/accounts ──
    await test.step('Step 1: Navigate to Accounts page', async () => {
      await navBar.goToAccounts();
      await accounts.isLoaded();
      expect(page.url()).toContain('bank/accounts');
    });

    // ── Step 2: Click 'Open New Account' ──
    await test.step('Step 2: Click "Open New Account" button', async () => {
      await accounts.openAccountWizard();
    });

    // ── Step 3: Assert the wizard dialog is open ──
    await test.step('Step 3: Assert wizard dialog is open', async () => {
      const wizard = page.locator('[data-testid="open-account-wizard"]');
      await expect(wizard).toBeVisible();
    });

    // ── Step 4: Assert step indicator shows 'Step 1 of 3' ──
    await test.step('Step 4: Assert step indicator shows "Step 1 of 3"', async () => {
      await accounts.assertStepIndicator('Step 1 of 3');
    });

    // ── Step 5: Click the Checking card & assert data-selected='true' ──
    await test.step('Step 5: Click Checking card and assert selected', async () => {
      await accounts.selectAccountType('checking');
      await accounts.assertTypeSelected('checking');
    });

    // ── Step 6: Click Next — assert step indicator shows 'Step 2 of 3' ──
    await test.step('Step 6: Click Next — assert "Step 2 of 3"', async () => {
      await accounts.clickWizardNext();
      await accounts.assertStepIndicator('Step 2 of 3');
    });

    // ── Step 7: Fill in Account Name and Initial Deposit ──
    await test.step('Step 7: Fill Account Name: "Checking account", Initial Deposit: 10000', async () => {
      await accounts.fillAccountDetails('Checking account', '10000');
    });

    // ── Step 8: Click Next — assert step indicator 'Step 3 of 3' and review summary ──
    await test.step('Step 8: Click Next — assert "Step 3 of 3" and review summary visible', async () => {
      await accounts.clickWizardNext();
      await accounts.assertStepIndicator('Step 3 of 3');
    });

    // ── Step 9: Click 'Confirm & Open Account' ──
    await test.step('Step 9: Click "Confirm & Open Account"', async () => {
      await accounts.confirmAccountCreation();
    });

    // ── Step 10: Assert success toast + account in table ──
    await test.step('Step 10: Assert success toast and account appears in table', async () => {
      await accounts.assertSuccessToast();
      const exists = await accounts.accountExists('Checking account');
      expect(exists, 'Account "Checking account" should appear in the accounts table').toBeTruthy();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // SCENARIO 3: Add Account with Credit Card Type
  // ═══════════════════════════════════════════════════════════════════════════════

  test('TC-ACC-03: Add Account with Credit Card Type — "credit card" ($200000)', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'TC-ACC-03' },
      { type: 'severity', description: 'critical' },
      { type: 'feature', description: 'Dashboard → Add Account' },
    );

    const { page, accounts, navBar } = adminSession;

    // ── Step 1: Log in as admin and navigate to /bank/accounts ──
    await test.step('Step 1: Navigate to Accounts page', async () => {
      await navBar.goToAccounts();
      await accounts.isLoaded();
      expect(page.url()).toContain('bank/accounts');
    });

    // ── Step 2: Click 'Open New Account' ──
    await test.step('Step 2: Click "Open New Account" button', async () => {
      await accounts.openAccountWizard();
    });

    // ── Step 3: Assert the wizard dialog is open ──
    await test.step('Step 3: Assert wizard dialog is open', async () => {
      const wizard = page.locator('[data-testid="open-account-wizard"]');
      await expect(wizard).toBeVisible();
    });

    // ── Step 4: Assert step indicator shows 'Step 1 of 3' ──
    await test.step('Step 4: Assert step indicator shows "Step 1 of 3"', async () => {
      await accounts.assertStepIndicator('Step 1 of 3');
    });

    // ── Step 5: Click the Credit Card card & assert data-selected='true' ──
    await test.step('Step 5: Click Credit Card and assert selected', async () => {
      await accounts.selectAccountType('credit');
      await accounts.assertTypeSelected('credit');
    });

    // ── Step 6: Click Next — assert step indicator shows 'Step 2 of 3' ──
    await test.step('Step 6: Click Next — assert "Step 2 of 3"', async () => {
      await accounts.clickWizardNext();
      await accounts.assertStepIndicator('Step 2 of 3');
    });

    // ── Step 7: Fill in Account Name and Initial Deposit ──
    await test.step('Step 7: Fill Account Name: "credit card", Initial Deposit: 200000', async () => {
      await accounts.fillAccountDetails('credit card', '200000');
    });

    // ── Step 8: Click Next — assert step indicator 'Step 3 of 3' and review summary ──
    await test.step('Step 8: Click Next — assert "Step 3 of 3" and review summary visible', async () => {
      await accounts.clickWizardNext();
      await accounts.assertStepIndicator('Step 3 of 3');
    });

    // ── Step 9: Click 'Confirm & Open Account' ──
    await test.step('Step 9: Click "Confirm & Open Account"', async () => {
      await accounts.confirmAccountCreation();
    });

    // ── Step 10: Assert success toast + account in table ──
    await test.step('Step 10: Assert success toast and account appears in table', async () => {
      await accounts.assertSuccessToast();
      const exists = await accounts.accountExists('credit card');
      expect(exists, 'Account "credit card" should appear in the accounts table').toBeTruthy();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // SCENARIO 4: Edit Account Name (Inline Edit)
  // ═══════════════════════════════════════════════════════════════════════════════

  test('TC-ACC-04: Edit account name via inline editing', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'TC-ACC-04' },
      { type: 'severity', description: 'normal' },
      { type: 'feature', description: 'Account → Edit Name' },
    );

    const { page, accounts, navBar } = adminSession;

    await test.step('Step 1: Navigate to Accounts page', async () => {
      await navBar.goToAccounts();
      await accounts.isLoaded();
    });

    await test.step('Step 2: Create account "Edit Target" to rename', async () => {
      await accounts.createAccount({ type: 'savings', name: 'Edit Target', deposit: '1000' });
    });

    await test.step('Step 3: Double-click account name to activate inline edit', async () => {
      await accounts.editAccountName('Edit Target', 'Renamed Premium Savings');
    });

    await test.step('Step 4: Verify new name "Renamed Premium Savings" appears', async () => {
      const exists = await accounts.accountExists('Renamed Premium Savings');
      expect(exists, 'Renamed account should be visible').toBeTruthy();
    });

    await test.step('Step 5: Verify old name "Edit Target" is gone', async () => {
      const oldExists = await accounts.accountExists('Edit Target');
      expect(oldExists, 'Old name should not be visible').toBeFalsy();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // SCENARIO 5: Delete Account
  // ═══════════════════════════════════════════════════════════════════════════════

  test('TC-ACC-05: Delete account with confirmation modal', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'TC-ACC-05' },
      { type: 'severity', description: 'normal' },
      { type: 'feature', description: 'Account → Delete' },
    );

    const { page, accounts, navBar } = adminSession;

    await test.step('Step 1: Navigate to Accounts page', async () => {
      await navBar.goToAccounts();
      await accounts.isLoaded();
    });

    await test.step('Step 2: Create account "Delete Target" to remove', async () => {
      await accounts.createAccount({ type: 'checking', name: 'Delete Target', deposit: '500' });
    });

    await test.step('Step 3: Verify account exists before deletion', async () => {
      const exists = await accounts.accountExists('Delete Target');
      expect(exists, 'Account should exist before deletion').toBeTruthy();
    });

    await test.step('Step 4: Click delete button and confirm in modal', async () => {
      await accounts.deleteAccount('Delete Target');
    });

    await test.step('Step 5: Verify account is removed from the table', async () => {
      const exists = await accounts.accountExists('Delete Target');
      expect(exists, 'Account should be removed after deletion').toBeFalsy();
    });
  });
});
