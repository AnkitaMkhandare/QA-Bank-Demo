const { test, expect } = require('@playwright/test');
const { BASE_URL } = require('./helpers');

test('TC-LOGIN-03: Login button disabled when fields are empty', async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page.locator('[data-testid="login-button"]')).toBeDisabled();

  await page.fill('[data-testid="username-input"]', 'admin');
  await expect(page.locator('[data-testid="login-button"]')).toBeDisabled();

  await page.fill('[data-testid="username-input"]', '');
  await page.fill('[data-testid="password-input"]', 'admin123');
  await expect(page.locator('[data-testid="login-button"]')).toBeDisabled();

  await page.fill('[data-testid="username-input"]', 'admin');
  await expect(page.locator('[data-testid="login-button"]')).toBeEnabled();
});