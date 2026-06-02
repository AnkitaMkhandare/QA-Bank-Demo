const { test, expect } = require('@playwright/test');
const { login, navigateTo } = require('./helpers');

test('TC-ACC-02: Edit account name inline by double-clicking', async ({ page }) => {
  await login(page, 'admin');
  await navigateTo(page, 'accounts');

  const nameCell = page.locator('[data-editable="true"]').first();
  await expect(nameCell).toHaveAttribute('data-editing', 'false');

  await nameCell.dblclick();
  await expect(nameCell).toHaveAttribute('data-editing', 'true');

  const inlineInput = page.locator('[data-testid="inline-edit-input"]');
  await expect(inlineInput).toBeVisible();
  await expect(inlineInput).toBeFocused();

  await page.evaluate(() => {
    const input = document.querySelector('[data-testid="inline-edit-input"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, 'Renamed Account');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  await expect(page.locator('[data-testid="inline-edit-input"]')).not.toBeVisible({ timeout: 5000 });
  await expect(page.locator('text=Renamed Account').first()).toBeVisible({ timeout: 5000 });
});