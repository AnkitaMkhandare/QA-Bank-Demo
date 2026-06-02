const { test, expect } = require('@playwright/test');
const { login } = require('./helpers');

test('TC-DASH-01: Dashboard displays summary cards after login', async ({ page }) => {
  await login(page, 'admin');

  await expect(page.locator('[data-testid="total-balance-card"]')).toBeVisible();
  await expect(page.locator('[data-testid="total-accounts-card"]')).toBeVisible();
  await expect(page.locator('[data-testid="recent-transactions-card"]')).toBeVisible();
});