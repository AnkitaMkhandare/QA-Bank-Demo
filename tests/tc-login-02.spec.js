const { test, expect } = require('@playwright/test');
const { BASE_URL } = require('./helpers');

test('TC-LOGIN-02: Login with invalid credentials shows error', async ({ page }) => {
  await page.goto(BASE_URL);
  await page.fill('[data-testid="username-input"]', 'wronguser');
  await page.fill('[data-testid="password-input"]', 'wrongpass');
  await page.click('[data-testid="login-button"]');
  await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
  await expect(page.locator('[data-testid="login-error"]')).toContainText('Invalid');
});