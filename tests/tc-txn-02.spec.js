const { test, expect } = require('@playwright/test');
const { login, navigateTo } = require('./helpers');

test('TC-TXN-02: Filter transactions by account', async ({ page }) => {
  await login(page, 'admin');
  await navigateTo(page, 'transactions');

  const rows = page.locator('[data-testid="transactions-tbody"] tr');
  const totalRows = await rows.count();

  // Filter by Primary Savings
  await page.click('[data-testid="filter-account-select"]');
  await page.waitForTimeout(300);
  await page.getByRole('option', { name: /Primary Savings/i }).click();
  await page.click('[data-testid="apply-filters-button"]');
  await page.waitForTimeout(500);

  // Verify filtered rows
  const filteredCount = await rows.count();
  for (let i = 0; i < filteredCount; i++) {
    const text = await rows.nth(i).textContent();
    expect(text).toMatch(/Primary Savings/i);
  }

  // Reset
  await page.click('[data-testid="reset-filters-button"]');
  await page.waitForTimeout(500);
  expect(await rows.count()).toBe(totalRows);
});