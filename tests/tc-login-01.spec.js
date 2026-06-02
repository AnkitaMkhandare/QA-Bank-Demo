const { test, expect } = require('@playwright/test');
const { BASE_URL, login } = require('./helpers');

test('TC-LOGIN-01: Successful admin login', async ({ page }) => {
  await login(page, 'admin');
  expect(page.url()).toContain('/bank/dashboard');
  await expect(page.locator('[data-testid="user-info"]')).toContainText('admin');
});