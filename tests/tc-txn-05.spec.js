const { test, expect } = require('@playwright/test');
const { login, navigateTo } = require('./helpers');

test('TC-TXN-05: Transaction detail page and breadcrumb navigation', async ({ page }) => {
  await login(page, 'admin');
  await navigateTo(page, 'transactions');

  // Click transaction ID link
  const txnLink = page.locator('[data-testid="transaction-id-link"]').first();
  await txnLink.click();
  await page.waitForURL('**/bank/transactions/**', { timeout: 10000 });
  expect(page.url()).toMatch(/\/bank\/transactions\/.+/);

  // Verify breadcrumb
  await expect(page.locator('[data-testid="breadcrumb-item-1"]')).toContainText('Dashboard');
  await expect(page.locator('[data-testid="breadcrumb-item-2"]')).toContainText('Transactions');

  // Verify detail fields
  await expect(page.locator('[data-testid="transaction-detail-type"]')).toBeVisible();
  await expect(page.locator('[data-testid="transaction-detail-amount"]')).toBeVisible();
  await expect(page.locator('[data-testid="transaction-detail-datetime"]')).toBeVisible();
  await expect(page.locator('[data-testid="transaction-detail-account-link"]')).toBeVisible();
  await expect(page.locator('[data-testid="transaction-detail-balance-after"]')).toBeVisible();
  await expect(page.locator('[data-testid="transaction-detail-status"]')).toBeVisible();

  // Back button
  await page.click('[data-testid="back-button"]');
  await page.waitForURL('**/bank/transactions', { timeout: 10000 });
  expect(page.url()).toMatch(/\/bank\/transactions\/?$/);
});