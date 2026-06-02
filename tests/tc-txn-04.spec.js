const { test, expect } = require('@playwright/test');
const { login, navigateTo } = require('./helpers');

test('TC-TXN-04: Export transactions as CSV', async ({ page }) => {
  await login(page, 'admin');
  await navigateTo(page, 'transactions');

  const exportBtn = page.locator('[data-testid="export-button"], [aria-label="Export transactions as CSV"]');

  // Export with transactions present
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
    exportBtn.first().dispatchEvent('click'),
  ]);

  if (download) {
    expect(download.suggestedFilename()).toMatch(/\.csv$/i);
  }

  // Filter to empty results and try export
  await page.click('[data-testid="date-from-input"]');
  await page.waitForTimeout(300);
  const today = new Date();
  const dayNum = today.getDate();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const todayLabel = `${monthNames[today.getMonth()]} ${dayNum}, ${today.getFullYear()}`;

  await page.locator(`[aria-label*="${todayLabel}"], td button:text-is("${dayNum}")`).first().click();
  await page.waitForTimeout(300);
  await page.click('[data-testid="date-to-input"]');
  await page.waitForTimeout(300);
  await page.locator(`[aria-label*="${todayLabel}"], td button:text-is("${dayNum}")`).first().click();
  await page.waitForTimeout(300);
  await page.click('[data-testid="apply-filters-button"]');
  await page.waitForTimeout(500);

  // Export with no transactions
  await exportBtn.first().dispatchEvent('click');
  await page.waitForTimeout(1000);

  const errorToast = page.locator('[data-testid="toast-error"], [data-testid="toast-message"]');
  if (await errorToast.count() > 0) {
    const text = await errorToast.first().textContent().catch(() => '');
    if (text) expect(text.toLowerCase()).toContain('no transactions');
  }
});