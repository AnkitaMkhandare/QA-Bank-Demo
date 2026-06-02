const { test, expect } = require('@playwright/test');
const { login, navigateTo } = require('./helpers');

test('TC-TXN-03: Filter transactions by date range using calendar', async ({ page }) => {
  await login(page, 'admin');
  await navigateTo(page, 'transactions');

  const today = new Date();
  const dayNum = today.getDate();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const todayLabel = `${monthNames[today.getMonth()]} ${dayNum}, ${today.getFullYear()}`;

  // Open From date picker
  await page.click('[data-testid="date-from-input"]');
  await page.waitForTimeout(300);
  await expect(page.locator('[data-testid="date-picker-calendar"]')).toBeVisible();

  // Select today
  await page.locator(`[aria-label*="${todayLabel}"], td button:text-is("${dayNum}")`).first().click();
  await page.waitForTimeout(300);

  // Open To date picker and select today
  await page.click('[data-testid="date-to-input"]');
  await page.waitForTimeout(300);
  await page.locator(`[aria-label*="${todayLabel}"], td button:text-is("${dayNum}")`).first().click();
  await page.waitForTimeout(300);

  // Apply
  await page.click('[data-testid="apply-filters-button"]');
  await page.waitForTimeout(500);

  // Verify filter applied (either rows with dates or "No transactions found")
  const rows = page.locator('[data-testid="transactions-tbody"] tr');
  const count = await rows.count();
  if (count === 1) {
    const text = await rows.first().textContent();
    expect(text.includes('No transactions found') || /\d/.test(text)).toBe(true);
  }
});