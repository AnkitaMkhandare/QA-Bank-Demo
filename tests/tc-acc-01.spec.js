const { test, expect } = require('@playwright/test');
const { login, navigateTo } = require('./helpers');

test('TC-ACC-01: Create a new account via wizard', async ({ page }) => {
  await login(page, 'admin');
  await navigateTo(page, 'accounts');

  await page.locator('[data-testid="open-wizard-button"]').dispatchEvent('click');
  await expect(page.locator('[data-testid="open-account-wizard"]')).toBeVisible();

  // Step 1: Select type
  await page.locator('[data-testid="type-card-savings"]').click();
  await page.click('[data-testid="wizard-next"]');

  // Step 2: Name and deposit
  await page.fill('[data-testid="wizard-account-name"]', 'Automation Test');
  await page.fill('[data-testid="wizard-initial-deposit"]', '500');
  await page.click('[data-testid="wizard-next"]');

  // Step 3: Confirm
  await page.click('[data-testid="wizard-confirm"]');
  await page.waitForTimeout(1000);

  await expect(page.locator('text=Automation Test').first()).toBeVisible({ timeout: 5000 });
});