const { test, expect } = require('@playwright/test');
const { login } = require('./helpers');

test('TC-LOGIN-05: Successful viewer login with read-only access', async ({ page }) => {
  await login(page, 'viewer');
  expect(page.url()).toContain('/bank/dashboard');
  await expect(page.locator('[data-testid="user-info"]')).toContainText('viewer');
});