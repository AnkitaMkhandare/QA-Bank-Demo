const { test, expect } = require('@playwright/test');
const { login, navigateTo } = require('./helpers');

test('TC-TXN-01: Create a deposit transaction and verify balance update', async ({ page }) => {
  await login(page, 'admin');
  await navigateTo(page, 'accounts');

  // Note initial balance
  const primaryRow = page.locator('tr:has-text("Primary Savings")');
  const initialText = await primaryRow.locator('[data-testid="account-balance"]').textContent();
  const initialBalance = parseFloat(initialText.replace(/[^0-9.-]/g, ''));

  // Navigate to transactions and create deposit
  await navigateTo(page, 'transactions');
  await page.locator('[data-testid="new-transaction-button"]').dispatchEvent('click');

  const modal = page.locator('[data-testid="transaction-modal"]');
  await expect(modal).toBeVisible({ timeout: 5000 });

  // Select Deposit type
  const typeSelect = page.locator('[data-testid="transaction-type-select"]');
  if (await typeSelect.count() > 0) {
    await typeSelect.click();
    await page.getByRole('option', { name: 'Deposit' }).click();
  }

  // Select account
  await page.locator('[data-testid="from-account-select"]').click();
  await page.waitForTimeout(300);
  await page.getByRole('option', { name: /Primary Savings/i }).click();

  // Enter amount and submit
  await modal.locator('input[data-testid="amount-input"], input#amount, input[type="number"], input[placeholder*="mount"]').first().fill('500');
  await modal.locator('[data-testid="submit-transaction"], [data-testid="transaction-submit"], button:has-text("Submit")').first().click();
  await page.waitForTimeout(1000);

  await expect(page.locator('text=$500').first()).toBeVisible({ timeout: 5000 });

  // Verify balance increased
  await navigateTo(page, 'accounts');
  const newText = await primaryRow.locator('[data-testid="account-balance"]').textContent();
  const newBalance = parseFloat(newText.replace(/[^0-9.-]/g, ''));
  expect(newBalance).toBeCloseTo(initialBalance + 500, 2);
});