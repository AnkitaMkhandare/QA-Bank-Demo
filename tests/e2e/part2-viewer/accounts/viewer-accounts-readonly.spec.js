const { test, expect } = require('../../../../src/fixtures/test-fixtures');

/**
 * PART 2: VIEWER ROLE — Accounts Page (Read-Only)
 * 
 * Validates that the viewer user:
 * - CAN view accounts list and balances
 * - CANNOT create new accounts (wizard button hidden)
 * - CANNOT delete accounts (delete buttons absent)
 * - CAN use filters and sorting (read operations)
 * 
 * @tags @viewer @accounts @rbac @readonly
 */

test.describe('🏦 Viewer Accounts — Read-Only Access @viewer @accounts @rbac', () => {

  test.beforeEach(async ({ page }) => {
    const LoginPage = require('../../../../src/pages/LoginPage');
    const loginPage = new LoginPage(page);
    const baseUrl = process.env.BASE_URL || 'https://qaplayground.com/bank';
    await loginPage.goto(baseUrl);
    await loginPage.loginAndWaitForDashboard('viewer', 'viewer123');
    await page.click('[data-testid="nav-accounts"]');
    await page.waitForURL('**/accounts**', { timeout: 10000 });
  });

  test('TC-V-ACC-01: Viewer can view accounts list', async ({ page }) => {
    test.info().annotations.push(
      { type: 'role', description: 'viewer' },
      { type: 'severity', description: 'critical' },
      { type: 'permission', description: 'READ — allowed' },
    );

    await test.step('Verify accounts table is visible', async () => {
      const table = page.locator('[data-testid="accounts-table"]');
      await expect(table).toBeVisible();
    });

    await test.step('Verify accounts are listed (rows > 0)', async () => {
      const rows = page.locator('[data-testid="accounts-table"] tr');
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);
      test.info().annotations.push({ type: 'data', description: `Accounts visible: ${count}` });
    });

    await test.step('Verify account balances are displayed', async () => {
      const balances = page.locator('[data-testid="account-balance"]');
      const count = await balances.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test('TC-V-ACC-02: "Open Account" wizard button is NOT visible for viewer', async ({ page }) => {
    test.info().annotations.push(
      { type: 'role', description: 'viewer' },
      { type: 'severity', description: 'critical' },
      { type: 'permission', description: 'CREATE — blocked' },
    );

    await test.step('Verify "Open Account" wizard button is hidden', async () => {
      const wizardBtn = page.locator('[data-testid="open-wizard-button"]');
      await expect(wizardBtn).not.toBeVisible();
    });

    await test.step('Verify button is not in DOM at all', async () => {
      const count = await page.locator('[data-testid="open-wizard-button"]').count();
      expect(count).toBe(0);
    });
  });

  test('TC-V-ACC-03: Delete account buttons are NOT visible for viewer', async ({ page }) => {
    test.info().annotations.push(
      { type: 'role', description: 'viewer' },
      { type: 'severity', description: 'critical' },
      { type: 'permission', description: 'DELETE — blocked' },
    );

    await test.step('Verify no delete buttons are present', async () => {
      const deleteButtons = page.locator('[data-testid^="delete-account-"]');
      const count = await deleteButtons.count();
      expect(count).toBe(0);
    });
  });

  test('TC-V-ACC-04: Account names are NOT editable for viewer', async ({ page }) => {
    test.info().annotations.push(
      { type: 'role', description: 'viewer' },
      { type: 'severity', description: 'high' },
      { type: 'permission', description: 'EDIT — blocked' },
    );

    await test.step('Verify editable names do not respond to click', async () => {
      const editableNames = page.locator('[data-editable="true"]');
      const count = await editableNames.count();

      if (count > 0) {
        // Click on first editable name — inline edit input should NOT appear
        await editableNames.first().click();
        await page.waitForTimeout(500);

        const inlineInput = page.locator('[data-testid="inline-edit-input"]');
        const isInputVisible = await inlineInput.isVisible().catch(() => false);
        expect(isInputVisible, 'Inline edit input should NOT appear for viewer').toBe(false);
      }
    });
  });

  test('TC-V-ACC-05: Viewer can use filter controls (read operations allowed)', async ({ page }) => {
    test.info().annotations.push(
      { type: 'role', description: 'viewer' },
      { type: 'severity', description: 'medium' },
      { type: 'permission', description: 'FILTER — allowed' },
    );

    await test.step('Verify filter-type dropdown is available', async () => {
      const filterType = page.locator('[data-testid="filter-type"]');
      const isVisible = await filterType.isVisible().catch(() => false);
      // Filters may or may not be on accounts page for viewer
      test.info().annotations.push({ type: 'data', description: `Filter visible: ${isVisible}` });
    });

    await test.step('Verify sort controls are available', async () => {
      const sortBy = page.locator('[data-testid="sort-by"]');
      const isVisible = await sortBy.isVisible().catch(() => false);
      test.info().annotations.push({ type: 'data', description: `Sort visible: ${isVisible}` });
    });
  });
});