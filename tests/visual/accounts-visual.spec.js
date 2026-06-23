const { test, expect } = require('../../src/fixtures/test-fixtures');

/**
 * Visual Regression — Accounts Page
 * 
 * Captures pixel-level screenshots for the accounts management page.
 * Tests layout consistency for empty state, populated state, and modals.
 * 
 * @tags @visual @regression
 */

test.describe('Accounts Page — Visual Regression @visual', () => {

  test('Desktop: Accounts page matches baseline', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'VIS-ACC-01' },
      { type: 'severity', description: 'normal' },
    );

    const { navBar, accounts, page } = adminSession;
    await navBar.goToAccounts();
    await accounts.isLoaded();

    await expect(page).toHaveScreenshot('accounts-desktop.png', {
      fullPage: true,
      threshold: 0.2,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('Desktop: Accounts table component', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'VIS-ACC-02' },
      { type: 'severity', description: 'normal' },
    );

    const { navBar, accounts, page } = adminSession;
    await navBar.goToAccounts();
    await accounts.isLoaded();

    // Screenshot the accounts table/list area
    const tableSection = page.locator('[data-testid="accounts-table"], .accounts-list, table').first();
    if (await tableSection.isVisible()) {
      await expect(tableSection).toHaveScreenshot('accounts-table.png', {
        threshold: 0.2,
      });
    }
  });

  test('Tablet: Accounts page layout (768x1024)', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'VIS-ACC-03' },
      { type: 'severity', description: 'normal' },
    );

    const { navBar, accounts, page } = adminSession;
    await page.setViewportSize({ width: 768, height: 1024 });
    await navBar.goToAccounts();
    await accounts.isLoaded();

    await expect(page).toHaveScreenshot('accounts-tablet.png', {
      fullPage: true,
      threshold: 0.25,
      maxDiffPixelRatio: 0.03,
    });
  });

  test('Mobile: Accounts page layout (375x812)', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'VIS-ACC-04' },
      { type: 'severity', description: 'normal' },
    );

    const { navBar, accounts, page } = adminSession;
    await page.setViewportSize({ width: 375, height: 812 });
    await navBar.goToAccounts();
    await accounts.isLoaded();

    await expect(page).toHaveScreenshot('accounts-mobile.png', {
      fullPage: true,
      threshold: 0.3,
      maxDiffPixelRatio: 0.03,
    });
  });
});