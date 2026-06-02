const { test, expect } = require('@playwright/test');
const { login } = require('./helpers');

test('TC-DASH-05: Recent transactions list displays on dashboard', async ({ page }) => {
  await login(page, 'admin');

  const recentTxn = page.locator('[data-testid="recent-transactions-card"]');
  await expect(recentTxn).toBeVisible();

  const txnItems = recentTxn.locator('[data-testid^="recent-txn-"]');
  const count = await txnItems.count();
  expect(count).toBeGreaterThan(0);
});