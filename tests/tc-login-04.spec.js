const { test, expect } = require('@playwright/test');
const { BASE_URL } = require('./helpers');

test('TC-LOGIN-04: Password field masks input', async ({ page }) => {
  await page.goto(BASE_URL);
  const passwordInput = page.locator('[data-testid="password-input"]');
  await expect(passwordInput).toHaveAttribute('type', 'password');

  await page.fill('[data-testid="password-input"]', 'secret123');
  await expect(passwordInput).toHaveAttribute('type', 'password');

  const toggle = page.locator('[data-testid="toggle-password"]');
  if (await toggle.count() > 0) {
    await toggle.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await toggle.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  }
});