const { test, expect } = require('@playwright/test');
const { login, navigateTo } = require('./helpers');

test('TC-ACC-05: Sort accounts by Balance column header', async ({ page }) => {
  await login(page, 'admin');
  await navigateTo(page, 'accounts');

  const header = page.locator('[data-testid="sort-balance-header"]');
  const balanceCells = page.locator('[data-testid="account-balance"]');

  async function getBalances() {
    const count = await balanceCells.count();
    const values = [];
    for (let i = 0; i < count; i++) {
      const text = await balanceCells.nth(i).textContent();
      values.push(parseFloat(text.replace(/[^0-9.-]/g, '')));
    }
    return values;
  }

  // Click 1: ascending
  await header.click();
  await page.waitForTimeout(500);
  await expect(header).toHaveAttribute('data-sort-direction', 'asc');
  const asc = await getBalances();
  expect(asc[0]).toBe(Math.min(...asc));

  // Click 2: descending
  await header.click();
  await page.waitForTimeout(500);
  await expect(header).toHaveAttribute('data-sort-direction', 'desc');
  const desc = await getBalances();
  expect(desc[0]).toBe(Math.max(...desc));

  // Click 3: none
  await header.click();
  await page.waitForTimeout(500);
  await expect(header).toHaveAttribute('data-sort-direction', 'none');
});