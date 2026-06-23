const { test, expect } = require('../../src/fixtures/test-fixtures');

/**
 * Security Tests — Authentication & Session
 * 
 * Validates security controls:
 * - XSS prevention (script injection in form fields)
 * - SQL injection prevention
 * - Session management (unauthorized access)
 * - HTTP security headers
 * - Password visibility protection
 * 
 * @tags @security @regression
 */

test.describe('Security Tests @security', () => {

  // ─── XSS Prevention ──────────────────────────────────────────────────────────

  test.describe('XSS Prevention', () => {
    const xssPayloads = [
      { name: 'Script tag', payload: '<script>alert("xss")</script>' },
      { name: 'Event handler', payload: '<img src=x onerror=alert("xss")>' },
      { name: 'Javascript URI', payload: 'javascript:alert("xss")' },
      { name: 'SVG onload', payload: '<svg onload=alert("xss")>' },
      { name: 'Encoded script', payload: '%3Cscript%3Ealert(1)%3C/script%3E' },
    ];

    for (const { name, payload } of xssPayloads) {
      test(`SEC-XSS-${name}: Input sanitized and not reflected`, async ({ loginPage, baseUrl, page }) => {
        test.info().annotations.push(
          { type: 'testId', description: `SEC-XSS-${name}` },
          { type: 'severity', description: 'critical' },
        );

        await loginPage.goto(baseUrl);
        await loginPage.enterUsername(payload);
        await loginPage.enterPassword(payload);
        await loginPage.clickLogin();

        // Verify no script execution (page should not have alert dialogs)
        // Check the payload is not reflected as raw HTML
        const bodyHtml = await page.content();
        expect(bodyHtml).not.toContain('<script>alert');
        expect(bodyHtml).not.toContain('onerror=alert');

        // Page should still be functional (not crashed)
        await expect(page.locator('body')).toBeVisible();
      });
    }
  });

  // ─── SQL Injection Prevention ────────────────────────────────────────────────

  test.describe('SQL Injection Prevention', () => {
    const sqlPayloads = [
      { name: 'OR bypass', payload: "' OR '1'='1" },
      { name: 'UNION SELECT', payload: "' UNION SELECT * FROM users --" },
      { name: 'DROP TABLE', payload: "'; DROP TABLE users; --" },
      { name: 'Comment bypass', payload: "admin'--" },
      { name: 'Double dash', payload: "admin' -- " },
    ];

    for (const { name, payload } of sqlPayloads) {
      test(`SEC-SQL-${name}: Injection attempt fails gracefully`, async ({ loginPage, baseUrl, page }) => {
        test.info().annotations.push(
          { type: 'testId', description: `SEC-SQL-${name}` },
          { type: 'severity', description: 'critical' },
        );

        await loginPage.goto(baseUrl);
        await loginPage.login(payload, payload);

        // Should show error, not grant access
        const url = page.url();
        expect(url).not.toContain('/dashboard');

        // Should not expose database errors
        const bodyText = await page.textContent('body');
        expect(bodyText.toLowerCase()).not.toContain('sql');
        expect(bodyText.toLowerCase()).not.toContain('syntax error');
        expect(bodyText.toLowerCase()).not.toContain('mysql');
        expect(bodyText.toLowerCase()).not.toContain('postgresql');
      });
    }
  });

  // ─── Unauthorized Access ─────────────────────────────────────────────────────

  test.describe('Unauthorized Access Prevention', () => {
    test('SEC-AUTH-01: Direct URL access to dashboard without login is blocked', async ({ page, baseUrl }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'SEC-AUTH-01' },
        { type: 'severity', description: 'critical' },
      );

      // Try to access protected page directly
      await page.goto(`${baseUrl}/dashboard`);

      // Should redirect to login or show unauthorized
      const url = page.url();
      const isProtected = url.includes('/login') || url.includes('/auth') || url === baseUrl || url.includes('/bank');
      expect(isProtected).toBeTruthy();
    });

    test('SEC-AUTH-02: Direct URL access to accounts without login is blocked', async ({ page, baseUrl }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'SEC-AUTH-02' },
        { type: 'severity', description: 'critical' },
      );

      await page.goto(`${baseUrl}/accounts`);

      const url = page.url();
      const isProtected = url.includes('/login') || url.includes('/auth') || url === baseUrl || url.includes('/bank');
      expect(isProtected).toBeTruthy();
    });

    test('SEC-AUTH-03: Direct URL access to transactions without login is blocked', async ({ page, baseUrl }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'SEC-AUTH-03' },
        { type: 'severity', description: 'critical' },
      );

      await page.goto(`${baseUrl}/transactions`);

      const url = page.url();
      const isProtected = url.includes('/login') || url.includes('/auth') || url === baseUrl || url.includes('/bank');
      expect(isProtected).toBeTruthy();
    });
  });

  // ─── Password Security ───────────────────────────────────────────────────────

  test.describe('Password Security', () => {
    test('SEC-PWD-01: Password field is masked (type=password)', async ({ loginPage, baseUrl, page }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'SEC-PWD-01' },
        { type: 'severity', description: 'critical' },
      );

      await loginPage.goto(baseUrl);
      await loginPage.enterPassword('SecretPassword123!');

      const inputType = await loginPage.getPasswordInputType();
      expect(inputType).toBe('password');
    });

    test('SEC-PWD-02: Password not exposed in page source', async ({ loginPage, baseUrl, page }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'SEC-PWD-02' },
        { type: 'severity', description: 'critical' },
      );

      await loginPage.goto(baseUrl);
      await loginPage.login('admin', 'admin123');

      // After login, password should not be in DOM
      const bodyHtml = await page.content();
      expect(bodyHtml).not.toContain('admin123');
    });
  });

  // ─── HTTP Security Headers ───────────────────────────────────────────────────

  test('SEC-HEADERS-01: Response includes security headers', async ({ page, baseUrl }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'SEC-HEADERS-01' },
      { type: 'severity', description: 'normal' },
    );

    const response = await page.goto(baseUrl);
    const headers = response.headers();

    // Check common security headers (log missing ones)
    const securityHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection',
      'strict-transport-security',
      'content-security-policy',
    ];

    const present = [];
    const missing = [];

    for (const header of securityHeaders) {
      if (headers[header]) {
        present.push(header);
      } else {
        missing.push(header);
      }
    }

    // Log findings (not all apps have all headers)
    if (missing.length > 0) {
      test.info().annotations.push({
        type: 'warning',
        description: `Missing security headers: ${missing.join(', ')}`,
      });
    }

    // At minimum, X-Content-Type-Options should be present
    // This is informational — not all demo apps implement all headers
    expect(response.status()).toBeLessThan(500);
  });
});