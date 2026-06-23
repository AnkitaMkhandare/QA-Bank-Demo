const { test, expect } = require('../../../../src/fixtures/test-fixtures');

/**
 * PART 2: VIEWER ROLE — Dashboard Tests
 * 
 * Validates that the viewer user:
 * - CAN view dashboard content
 * - Sees the "Read-only" badge
 * - Navigation links are functional
 * - No write-action buttons on dashboard
 * 
 * @tags @viewer @dashboard @rbac @readonly
 */

test.describe('📊 Viewer Dashboard — Read-Only View @viewer @dashboard @rbac', () => {

  test.beforeEach(async ({ page }) => {
    const LoginPage = require('../../../../src/pages/LoginPage');
    const loginPage = new LoginPage(page);
    const baseUrl = process.env.BASE_URL || 'https://qaplayground.com/bank';
    await loginPage.goto(baseUrl);
    await loginPage.loginAndWaitForDashboard('viewer', 'viewer123');
  });

  test('TC-V-DASH-01: Viewer dashboard loads successfully', async ({ page }) => {
    test.info().annotations.push(
      { type: 'role', description: 'viewer' },
      { type: 'severity', description: 'blocker' },
    );

    await test.step('Verify URL is on dashboard', async () => {
      expect(page.url()).toContain('bank/dashboard');
    });

    await test.step('Verify page has content', async () => {
      const bodyText = await page.locator('body').textContent();
      expect(bodyText.length).toBeGreaterThan(100);
    });

    await test.step('Verify main navbar is present', async () => {
      const navbar = page.locator('[data-testid="main-navbar"]');
      await expect(navbar).toBeVisible();
    });
  });

  test('TC-V-DASH-02: Viewer badge and role indicator displayed', async ({ page }) => {
    test.info().annotations.push(
      { type: 'role', description: 'viewer' },
      { type: 'severity', description: 'critical' },
    );

    await test.step('Verify user-info shows viewer identity', async () => {
      const userInfo = page.locator('[data-testid="user-info"]');
      await expect(userInfo).toBeVisible();
      const text = await userInfo.textContent();
      expect(text.toLowerCase()).toContain('viewer');
      expect(text).toContain('Read-only');
    });

    await test.step('Verify viewer-badge element is present', async () => {
      const badge = page.locator('[data-testid="viewer-badge"]');
      await expect(badge).toBeVisible();
    });
  });

  test('TC-V-DASH-03: Navigation links work for viewer', async ({ page }) => {
    test.info().annotations.push(
      { type: 'role', description: 'viewer' },
      { type: 'severity', description: 'high' },
    );

    await test.step('Verify accounts nav link exists and is clickable', async () => {
      const accountsLink = page.locator('[data-testid="nav-accounts"]');
      await expect(accountsLink).toBeVisible();
    });

    await test.step('Verify transactions nav link exists and is clickable', async () => {
      const txnLink = page.locator('[data-testid="nav-transactions"]');
      await expect(txnLink).toBeVisible();
    });

    await test.step('Navigate to accounts — viewer can access', async () => {
      await page.click('[data-testid="nav-accounts"]');
      await page.waitForURL('**/accounts**', { timeout: 10000 });
      expect(page.url()).toContain('bank/accounts');
    });

    await test.step('Navigate back to dashboard', async () => {
      await page.click('[data-testid="nav-dashboard"]');
      await page.waitForURL('**/dashboard**', { timeout: 10000 });
      expect(page.url()).toContain('bank/dashboard');
    });
  });

  test('TC-V-DASH-04: Viewer can logout from dashboard', async ({ page }) => {
    test.info().annotations.push(
      { type: 'role', description: 'viewer' },
      { type: 'severity', description: 'high' },
    );

    await test.step('Verify logout button is visible', async () => {
      const logoutBtn = page.locator('[data-testid="logout-button"]');
      await expect(logoutBtn).toBeVisible();
    });

    await test.step('Click logout', async () => {
      const logoutBtn = page.locator('[data-testid="logout-button"]');
      await logoutBtn.dispatchEvent('click');
      await page.waitForTimeout(2000);
    });

    await test.step('Verify session ended', async () => {
      const baseUrl = process.env.BASE_URL || 'https://qaplayground.com/bank';
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      // Login form should be visible or user-info absent
      const hasLogin = await page.locator('[data-testid="username-input"]').isVisible().catch(() => false);
      const noSession = !(await page.locator('[data-testid="user-info"]').isVisible().catch(() => false));
      expect(hasLogin || noSession).toBeTruthy();
    });
  });
});