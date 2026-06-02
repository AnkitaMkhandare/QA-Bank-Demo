const { test, expect } = require('@playwright/test');
const { login } = require('./helpers');

test('TC-DASH-04: Navigation links work from dashboard', async ({ page }) => {
  await login(page, 'admin');

  await page.locator('[data-testid="nav-accounts"]').click();
  await page.waitForURL('**/bank/accounts', { timeout: 10000 });
  expect(page.url()).toContain('/bank/accounts');

  await page.locator('[data-testid="nav-transactions"]').click();
  await page.waitForURL('**/bank/transactions', { timeout: 10000 });
  expect(page.url()).toContain('/bank/transactions');

  await page.locator('[data-testid="nav-dashboard"]').click();
  await page.waitForURL('**/bank/dashboard', { timeout: 10000 });
  expect(page.url()).toContain('/bank/dashboard');
});