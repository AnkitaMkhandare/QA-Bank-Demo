const { test, expect } = require('@playwright/test');
const { login } = require('./helpers');

test('TC-DASH-02: Total Balance card matches sum of all account balances [KNOWN BUG]', async ({ page }) => {
  await login(page, 'admin');

  const balanceCard = page.locator('[data-testid="total-balance-card"]');
  const balanceText = await balanceCard.locator('[data-testid="card-value"], .text-2xl, .font-bold').first().textContent();
  const dashboardBalance = parseFloat(balanceText.replace(/[^0-9.-]/g, ''));

  await page.locator('[data-testid="nav-accounts"]').click();
  await page.waitForURL('**/bank/accounts', { timeout: 10000 });
  await page.waitForTimeout(1500);

  const balanceCells = page.locator('[data-testid="account-balance"]');
  const count = await balanceCells.count();
  let sum = 0;
  for (let i = 0; i < count; i++) {
    const text = await balanceCells.nth(i).textContent();
    sum += parseFloat(text.replace(/[^0-9.-]/g, ''));
  }

  // Known bug: dashboard balance may not match sum
  if (dashboardBalance !== sum) {
    console.log(`⚠️ BUG: Dashboard shows $${dashboardBalance}, accounts sum is $${sum}`);
  }
  expect(dashboardBalance).toBe(sum);
});