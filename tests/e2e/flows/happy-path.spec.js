const { test, expect } = require('../../../src/fixtures/test-fixtures');

/**
 * End-to-End Happy Path Flow
 * 
 * Full business workflow test covering the critical path:
 * Login → Dashboard → Create Account → Edit Account → Delete Account → 
 * Create Transaction → Verify Balance → Logout
 * 
 * This test validates the entire user journey in a single flow,
 * ensuring all features work together seamlessly.
 * 
 * @tags @smoke @critical @e2e
 */

test.describe('Happy Path Flow @critical @e2e', () => {

  test('Complete user journey: Login → Account CRUD → Transaction → Logout', async ({
    loginPage,
    dashboardPage,
    accountsPage,
    transactionsPage,
    navBar,
    baseUrl,
    credentials,
  }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'TC-HAPPY-PATH' },
      { type: 'severity', description: 'critical' },
      { type: 'tags', description: '@smoke, @critical, @e2e' },
      { type: 'owner', description: 'QA Automation Team' },
    );

    // ─── Step 1: Login as Admin ────────────────────────────────────────────────

    await test.step('Login as admin user', async () => {
      await loginPage.goto(baseUrl);
      await loginPage.isLoaded();
      await loginPage.loginAndWaitForDashboard(
        credentials.admin.username,
        credentials.admin.password
      );
    });

    // ─── Step 2: Verify Dashboard ──────────────────────────────────────────────

    await test.step('Verify dashboard loaded with user info', async () => {
      await dashboardPage.isLoaded();
      await dashboardPage.verifyLoggedInUser('admin');
      await dashboardPage.verifySummaryCardsVisible();
    });

    // ─── Step 3: Create New Account ────────────────────────────────────────────

    await test.step('Create new savings account "Happy Path Account"', async () => {
      await navBar.goToAccounts();
      await accountsPage.isLoaded();
      await accountsPage.createAccount({
        type: 'savings',
        name: 'Happy Path Account',
        deposit: '1000',
      });

      const exists = await accountsPage.accountExists('Happy Path Account');
      expect(exists).toBeTruthy();
    });

    // ─── Step 4: Edit Account Name ─────────────────────────────────────────────

    await test.step('Edit account name from "Happy Path Account" to "Verified Account"', async () => {
      await navBar.goToAccounts();
      await accountsPage.editAccountName('Happy Path Account', 'Verified Account');

      const exists = await accountsPage.accountExists('Verified Account');
      expect(exists).toBeTruthy();
    });

    // ─── Step 5: Delete Account ────────────────────────────────────────────────

    await test.step('Delete "Verified Account" with confirmation', async () => {
      await navBar.goToAccounts();
      await accountsPage.deleteAccount('Verified Account');

      const exists = await accountsPage.accountExists('Verified Account');
      expect(exists).toBeFalsy();
    });

    // ─── Step 6: Create Deposit Transaction ────────────────────────────────────

    await test.step('Create a deposit transaction of $250', async () => {
      await navBar.goToTransactions();
      await transactionsPage.isLoaded();
      await transactionsPage.createTransaction({
        type: 'Deposit',
        fromAccount: 'Primary Savings',
        amount: '250',
      });

      await transactionsPage.verifyTransactionVisible('250');
    });

    // ─── Step 7: Logout ────────────────────────────────────────────────────────

    await test.step('Logout and verify redirect to login page', async () => {
      await dashboardPage.logoutAndVerify(baseUrl);

      // Verify login page is displayed
      const isLoginVisible = await loginPage.isUsernameFieldVisible();
      expect(isLoginVisible).toBeTruthy();
    });
  });
});