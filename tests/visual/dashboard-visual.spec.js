const { test, expect } = require('../../src/fixtures/test-fixtures');

/**
 * Visual Regression — Dashboard Page
 * 
 * Captures pixel-level screenshots for the authenticated dashboard view.
 * Tests layout consistency across viewport sizes.
 * 
 * @tags @visual @regression
 */

test.describe('Dashboard — Visual Regression @visual', () => {

  test('Desktop: Dashboard page matches baseline', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'VIS-DASH-01' },
      { type: 'severity', description: 'normal' },
    );

    const { dashboard, page } = adminSession;
    await dashboard.isLoaded();

    await expect(page).toHaveScreenshot('dashboard-desktop.png', {
      fullPage: true,
      threshold: 0.2,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('Desktop: Dashboard summary cards section', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'VIS-DASH-02' },
      { type: 'severity', description: 'normal' },
    );

    const { dashboard, page } = adminSession;
    await dashboard.isLoaded();

    // Screenshot just the summary cards area
    const cardsSection = page.locator('[data-testid="summary-cards"], .summary-cards, .dashboard-cards').first();
    if (await cardsSection.isVisible()) {
      await expect(cardsSection).toHaveScreenshot('dashboard-summary-cards.png', {
        threshold: 0.2,
      });
    }
  });

  test('Tablet: Dashboard layout (768x1024)', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'VIS-DASH-03' },
      { type: 'severity', description: 'normal' },
    );

    const { page, dashboard } = adminSession;
    await page.setViewportSize({ width: 768, height: 1024 });
    await dashboard.isLoaded();

    await expect(page).toHaveScreenshot('dashboard-tablet.png', {
      fullPage: true,
      threshold: 0.25,
      maxDiffPixelRatio: 0.03,
    });
  });

  test('Mobile: Dashboard layout (375x812)', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'VIS-DASH-04' },
      { type: 'severity', description: 'normal' },
    );

    const { page, dashboard } = adminSession;
    await page.setViewportSize({ width: 375, height: 812 });
    await dashboard.isLoaded();

    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      fullPage: true,
      threshold: 0.3,
      maxDiffPixelRatio: 0.03,
    });
  });
});