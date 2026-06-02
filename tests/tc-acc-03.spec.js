const { test, expect } = require('@playwright/test');
const { login, navigateTo } = require('./helpers');

test('TC-ACC-03: Delete an account with confirmation', async ({ page }) => {
  await login(page, 'admin');
  await navigateTo(page, 'accounts');

  const deleteBtn = page.locator('[data-testid^="delete-account-"]').first();
  await expect(deleteBtn).toBeVisible();
  const testId = await deleteBtn.getAttribute('data-testid');
  const accountId = testId.replace('delete-account-', '');

  // Click delete, verify modal
  await deleteBtn.click();
  const modal = page.locator('[data-testid="delete-modal"]');
  await expect(modal).toBeVisible();
  await expect(page.locator('[data-testid="delete-message"]')).toContainText('cannot be undone');

  // Cancel and verify account still exists
  await page.click('[data-testid="cancel-delete-button"]');
  await expect(modal).not.toBeVisible({ timeout: 3000 });
  await expect(deleteBtn).toBeVisible();

  // Delete again and confirm
  await deleteBtn.click();
  await expect(modal).toBeVisible();
  await page.click('[data-testid="confirm-delete-button"]');
  await page.waitForTimeout(1000);

  await expect(page.locator(`[data-testid="delete-account-${accountId}"]`)).toHaveCount(0);
});