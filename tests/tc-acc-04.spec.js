const { test, expect } = require('@playwright/test');
const { login, navigateTo } = require('./helpers');

test('TC-ACC-04: Filter accounts by account type', async ({ page }) => {
  await login(page, 'admin');
  await navigateTo(page, 'accounts');

  const rows = page.locator('[data-testid="accounts-tbody"] tr');
  const totalRows = await rows.count();

  // Open filter and select Savings
  await page.click('[data-testid="filter-type-select"]');
  await page.waitForTimeout(300);
  await page.getByRole('option', { name: 'Savings' }).click();
  await page.waitForTimeout(500);

  // Verify all filtered rows show Savings
  const filteredRows = page.locator('[data-testid="accounts-tbody"] tr');
  const filteredCount = await filteredRows.count();
  for (let i = 0; i < filteredCount; i++) {
    const text = await filteredRows.nth(i).textContent();
    expect(text).toMatch(/Savings/i);
    expect(text).not.toMatch(/\bChecking\b/i);
    expect(text).not.toMatch(/\bCredit\b/i);
  }

  // Reset and verify
  await page.click('[data-testid="reset-filters-button"]');
  await page.waitForTimeout(500);
  expect(await rows.count()).toBe(totalRows);
});