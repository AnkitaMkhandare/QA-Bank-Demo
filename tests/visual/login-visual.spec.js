const { test, expect } = require('../../src/fixtures/test-fixtures');

/**
 * Visual Regression — Login Page
 * 
 * Captures pixel-level screenshots and compares against baselines.
 * Detects unintended UI changes across deployments.
 * 
 * Viewports tested:
 * - Desktop (1920x1080)
 * - Tablet (768x1024)
 * - Mobile (375x812)
 * 
 * @tags @visual @regression
 */

test.describe('Login Page — Visual Regression @visual', () => {

  test('Desktop: Login page matches baseline', async ({ loginPage, baseUrl }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'VIS-LOGIN-01' },
      { type: 'severity', description: 'normal' },
    );

    await loginPage.goto(baseUrl);
    await loginPage.isLoaded();

    await expect(loginPage.page).toHaveScreenshot('login-desktop.png', {
      fullPage: true,
      threshold: 0.2,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('Desktop: Login page with error state', async ({ loginPage, baseUrl }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'VIS-LOGIN-02' },
      { type: 'severity', description: 'normal' },
    );

    await loginPage.goto(baseUrl);
    await loginPage.login('invalid', 'invalid');

    await expect(loginPage.page).toHaveScreenshot('login-error-state.png', {
      fullPage: true,
      threshold: 0.2,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('Tablet: Login page layout (768x1024)', async ({ loginPage, baseUrl, page }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'VIS-LOGIN-03' },
      { type: 'severity', description: 'normal' },
    );

    await page.setViewportSize({ width: 768, height: 1024 });
    await loginPage.goto(baseUrl);
    await loginPage.isLoaded();

    await expect(page).toHaveScreenshot('login-tablet.png', {
      fullPage: true,
      threshold: 0.2,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('Mobile: Login page layout (375x812)', async ({ loginPage, baseUrl, page }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'VIS-LOGIN-04' },
      { type: 'severity', description: 'normal' },
    );

    await page.setViewportSize({ width: 375, height: 812 });
    await loginPage.goto(baseUrl);
    await loginPage.isLoaded();

    await expect(page).toHaveScreenshot('login-mobile.png', {
      fullPage: true,
      threshold: 0.3,
      maxDiffPixelRatio: 0.03,
    });
  });
});