const { test, expect } = require('@playwright/test');
const { BASE_URL, login, navigateTo } = require('./helpers');

test('TC-HAPPY_PATH_FLOW: Login, create account, edit, delete, transaction, logout', async ({ page }) => {
  // Step 1-2: Login
  await login(page, 'admin');

  // Step 3: Create account "Test 1"
  await navigateTo(page, 'accounts');
  await page.locator('[data-testid="open-wizard-button"]').dispatchEvent('click');
  await expect(page.locator('[data-testid="open-account-wizard"]')).toBeVisible();
  await page.locator('[data-testid="type-card-savings"]').click();
  await page.click('[data-testid="wizard-next"]');
  await page.fill('[data-testid="wizard-account-name"]', 'Test 1');
  await page.fill('[data-testid="wizard-initial-deposit"]', '1000');
  await page.click('[data-testid="wizard-next"]');
  await page.click('[data-testid="wizard-confirm"]');
  await page.waitForTimeout(1000);
  await expect(page.locator('text=Test 1').first()).toBeVisible({ timeout: 5000 });

  // Step 4: Edit account name to "Rose"
  await navigateTo(page, 'accounts');
  const nameCell = page.locator('[data-editable="true"]', { hasText: 'Test 1' }).first();
  await nameCell.dblclick();
  await expect(page.locator('[data-testid="inline-edit-input"]')).toBeVisible({ timeout: 5000 });
  await page.evaluate(() => {
    const input = document.querySelector('[data-testid="inline-edit-input"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, 'Rose');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  await expect(page.locator('text=Rose').first()).toBeVisible({ timeout: 5000 });

  // Step 5: Delete account "Rose"
  await navigateTo(page, 'accounts');
  const roseRow = page.locator('tr:has-text("Rose")');
  await roseRow.locator('[data-testid^="delete-account-"]').click();
  await expect(page.locator('[data-testid="delete-modal"]')).toBeVisible();
  await page.click('[data-testid="confirm-delete-button"]');
  await page.waitForTimeout(1000);
  await expect(roseRow).not.toBeVisible({ timeout: 5000 });

  // Step 6: Create deposit transaction
  await navigateTo(page, 'transactions');
  await page.locator('[data-testid="new-transaction-button"]').dispatchEvent('click');
  const modal = page.locator('[data-testid="transaction-modal"]');
  await expect(modal).toBeVisible({ timeout: 5000 });

  const typeSelect = page.locator('[data-testid="transaction-type-select"]');
  if (await typeSelect.count() > 0) {
    await typeSelect.click();
    await page.getByRole('option', { name: 'Deposit' }).click();
  }
  await page.locator('[data-testid="from-account-select"]').click();
  await page.waitForTimeout(300);
  await page.getByRole('option').first().click();
  await modal.locator('input[data-testid="amount-input"], input#amount, input[type="number"], input[placeholder*="mount"]').first().fill('250');
  await modal.locator('[data-testid="submit-transaction"], [data-testid="transaction-submit"], button:has-text("Submit")').first().click();
  await page.waitForTimeout(1000);
  await expect(page.locator('text=$250').first()).toBeVisible({ timeout: 5000 });

  // Step 7: Logout
  await page.locator('[data-testid="logout-button"]').dispatchEvent('click');
  await page.waitForTimeout(2000);
  await page.goto(BASE_URL);
  await page.waitForTimeout(1000);
  await expect(page.locator('[data-testid="username-input"]')).toBeVisible({ timeout: 5000 });
});