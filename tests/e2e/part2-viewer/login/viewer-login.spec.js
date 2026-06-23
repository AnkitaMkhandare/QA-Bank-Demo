const { test, expect } = require('../../../../src/fixtures/test-fixtures');

/**
 * PART 2: VIEWER ROLE — Login Tests
 * 
 * Validates that the viewer (read-only) user can:
 * - Successfully authenticate with valid credentials
 * - See the "Read-only" role badge after login
 * - Cannot login with invalid credentials
 * 
 * @tags @viewer @login @rbac @smoke
 */

test.describe('🔐 Viewer Login @viewer @login @rbac', () => {

  test('TC-V-LOGIN-01: Viewer can login with valid credentials', async ({ loginPage, page, baseUrl, credentials }) => {
    test.info().annotations.push(
      { type: 'role', description: 'viewer' },
      { type: 'severity', description: 'blocker' },
    );

    await test.step('Navigate to login page', async () => {
      await loginPage.goto(baseUrl);
    });

    await test.step('Enter viewer credentials and login', async () => {
      await loginPage.loginAndWaitForDashboard(
        credentials.viewer.username,
        credentials.viewer.password
      );
    });

    await test.step('Verify redirect to dashboard', async () => {
      expect(page.url()).toContain('bank/dashboard');
    });

    await test.step('Verify user info shows "viewer" with read-only badge', async () => {
      const userInfo = page.locator('[data-testid="user-info"]');
      await expect(userInfo).toBeVisible();
      const text = await userInfo.textContent();
      expect(text.toLowerCase()).toContain('viewer');
    });

    await test.step('Verify read-only badge is displayed', async () => {
      const badge = page.locator('[data-testid="viewer-badge"]');
      await expect(badge).toBeVisible();
    });
  });

  test('TC-V-LOGIN-02: Viewer cannot login with wrong password', async ({ loginPage, page, baseUrl }) => {
    test.info().annotations.push(
      { type: 'role', description: 'viewer' },
      { type: 'severity', description: 'critical' },
    );

    await test.step('Navigate to login page', async () => {
      await loginPage.goto(baseUrl);
    });

    await test.step('Enter viewer username with wrong password', async () => {
      await loginPage.login('viewer', 'wrongpassword');
    });

    await test.step('Verify login fails — error message shown', async () => {
      const errorMsg = page.locator('[data-testid="login-error"], [role="alert"]');
      await expect(errorMsg).toBeVisible({ timeout: 5000 });
    });

    await test.step('Verify still on login page', async () => {
      expect(page.url()).not.toContain('dashboard');
    });
  });

  test('TC-V-LOGIN-03: Viewer session shows correct role identifier', async ({ page, baseUrl }) => {
    test.info().annotations.push(
      { type: 'role', description: 'viewer' },
      { type: 'severity', description: 'high' },
    );

    const LoginPage = require('../../../../src/pages/LoginPage');
    const loginPage = new LoginPage(page);

    await test.step('Login as viewer', async () => {
      await loginPage.goto(baseUrl);
      await loginPage.loginAndWaitForDashboard('viewer', 'viewer123');
    });

    await test.step('Verify role badge text contains "Read-only"', async () => {
      const userInfo = page.locator('[data-testid="user-info"]');
      const text = await userInfo.textContent();
      expect(text).toContain('Read-only');
    });

    await test.step('Verify viewer-badge element exists', async () => {
      const viewerBadge = page.locator('[data-testid="viewer-badge"]');
      await expect(viewerBadge).toBeVisible();
    });
  });
});